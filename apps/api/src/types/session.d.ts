import 'express-session';
import { UserRole } from '@campusloop/shared';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    userRole: UserRole;
    collegeId: string;
    emailVerified: boolean;
  }
}
