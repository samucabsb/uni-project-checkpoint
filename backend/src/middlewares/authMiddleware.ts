import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';
export interface AuthRequest extends Request { usuario?: TokenPayload }
export function authMiddleware(req:AuthRequest,res:Response,next:NextFunction){const header=req.headers.authorization;if(!header)return res.status(401).json({message:'Faça login para continuar.'});const token=header.split(' ')[1];try{req.usuario=verifyToken(token);next()}catch{return res.status(401).json({message:'Sessão expirada. Entre novamente.'})}}
export function adminMiddleware(req:AuthRequest,res:Response,next:NextFunction){if(req.usuario?.tipo_usuario!=='ADMIN')return res.status(403).json({message:'Ação permitida apenas para administradores.'});next()}
