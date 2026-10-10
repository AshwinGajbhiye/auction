import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../shared/prisma';
import * as authService from './auth.service';
import { ConflictError, UnauthorizedError } from '../../shared/errors';

describe('Auth Service', () => {
  let collegeId: string;
  const testEmail = `test.student.${Date.now()}@student.demo.edu`;

  beforeAll(async () => {
    const college = await prisma.college.findFirst({ where: { slug: 'demo-university' } });
    if (!college) throw new Error('Demo college not found');
    collegeId = college.id;
  });

  afterAll(async () => {
    // Clean up created test user
    await prisma.user.deleteMany({
      where: { email: { contains: 'test.student.' } },
    });
  });

  it('successfully registers a new student with valid college domain', async () => {
    const user = await authService.registerUser({
      name: 'Test Student',
      email: testEmail,
      password: 'SecurePassword123!',
      collegeId,
    });

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.role).toBe('STUDENT');
  });

  it('rejects duplicate email registration with ConflictError', async () => {
    await expect(
      authService.registerUser({
        name: 'Another Student',
        email: testEmail,
        password: 'AnotherPassword123!',
        collegeId,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('authenticates user with correct password', async () => {
    const user = await authService.loginUser({
      email: testEmail,
      password: 'SecurePassword123!',
    });

    expect(user.email).toBe(testEmail);
    expect(user.name).toBe('Test Student');
  });

  it('rejects login with incorrect password with UnauthorizedError', async () => {
    await expect(
      authService.loginUser({
        email: testEmail,
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
