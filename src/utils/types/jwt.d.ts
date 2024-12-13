export interface AuthToken {
    id: string;
    username: string;
    role: "student" | "instructor";
    type: "refreshToken" | "accessToken";
    iat: number;
    exp: number;
}

export interface DecodedToken {
    id: string;
    role: "student" | "instructor";
    type: "refreshToken" | "accessToken";
    iat: number;
    exp: number;
}
