import Router, { Request, Response } from 'express';
import { DbUtilities } from '../utilities/db-utilities';

export const appRouter = Router();

interface IOptions {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete' | 'head';
    middlewares?: any[];
}

function routable(options: IOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        console.info(`Setting up endpoint ${options.method.toUpperCase()}  \t/api${options.path}`);

        const origFunc = descriptor.value;

        descriptor.value = async function (...args: any) {
            let request = args[0] as Request;
            let response = args[1] as Response;
            

            origFunc(request, response);
        };

        appRouter[options.method](`/api${options.path}`, descriptor.value);
        return descriptor;
    };
}

export default routable;
