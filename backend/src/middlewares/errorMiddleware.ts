import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
export function errorMiddleware(error:unknown,req:Request,res:Response,next:NextFunction){if(error instanceof ZodError)return res.status(400).json({message:'Dados inválidos.',errors:error.flatten().fieldErrors});console.error(error);return res.status(500).json({message:'Erro interno do servidor.'})}
