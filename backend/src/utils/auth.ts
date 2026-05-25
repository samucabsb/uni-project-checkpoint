import jwt from 'jsonwebtoken';
export type TokenPayload={id_usuario:number;nm_usuario:string;tipo_usuario:string};
export const generateToken=(payload:TokenPayload)=>jwt.sign(payload,process.env.JWT_SECRET||'secret',{expiresIn:(process.env.JWT_EXPIRES_IN||'7d') as jwt.SignOptions['expiresIn']});
export const verifyToken=(token:string)=>jwt.verify(token,process.env.JWT_SECRET||'secret') as TokenPayload;
