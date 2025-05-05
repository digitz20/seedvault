
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose'; // Using 'jose' for JWT verification as it's standard and works in Edge Runtime
import { userClientDataSchema, type UserClientData } from '@/lib/definitions'; // Import user schema

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    // In a real app, you might throw an error or handle this more gracefully
    // For development, we log the error but might allow the app to continue (with auth failing)
    // throw new Error('JWT_SECRET must be defined in environment variables.');
}

// Define the expected shape of the JWT payload
interface JWTPayload {
  id: string;
  email: string;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

// Function to get the JWT secret key in the required format for 'jose'
const getJwtSecretKey = (): Uint8Array => {
    if (!JWT_SECRET) {
        // This should ideally not happen if checked at startup, but safety first
        throw new Error('JWT_SECRET is not configured.');
    }
    return new TextEncoder().encode(JWT_SECRET);
};


// Function to verify the JWT from cookies
export async function verifyAuth(): Promise<{ user: UserClientData | null; error?: string }> {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
        return { user: null }; // No token, not authenticated
    }

    try {
        const secretKey = getJwtSecretKey();
        const { payload } = await jwtVerify<JWTPayload>(token, secretKey, {
             // Specify expected algorithms if necessary, e.g., algorithms: ['HS256']
        });

        // Validate the payload structure against our Zod schema
         const validatedUser = userClientDataSchema.safeParse({
             id: payload.id,
             email: payload.email,
         });

         if (!validatedUser.success) {
             console.error("JWT payload validation failed:", validatedUser.error);
             return { user: null, error: "Invalid token payload." };
         }

        return { user: validatedUser.data }; // Return validated user data

    } catch (err) {
        // Handle different verification errors
        if (err instanceof Error && err.name === 'JWTExpired') {
            console.log("Token expired.");
            return { user: null, error: "Token expired." };
        } else if (err instanceof Error && (err.name === 'JWSSignatureVerificationFailed' || err.name === 'JWSInvalid')) {
             console.error("Token verification failed:", err.message);
             return { user: null, error: "Invalid token." };
        } else {
            console.error("JWT verification error:", err);
            return { user: null, error: "Authentication error." };
        }
    }
}

// Simple type for the session object
export type Session = {
  user: UserClientData | null;
  error?: string; // Optional error message
};

// Utility function to get session data easily in Server Components
export async function getUserAuth(): Promise<Session> {
  const { user, error } = await verifyAuth();
  return { user, error };
}
