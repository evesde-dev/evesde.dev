import Router, { Request, Response } from "express";
import JWT from "jsonwebtoken";
import { JWTPayload } from "../models/jwtpayload.model";
import { swagger } from "../models/swagger/swagger.model";
import { swaggerMethod } from "../models/swagger/swaggermethod.model";
import { swaggerPath } from "../models/swagger/swaggerpath.model";
require("dotenv").config();

export const appRouter = Router();

export const swaggerDeff: swagger = {
    swagger: "2.0",
    info: {
        title: process.env.SWAG_PAGE_TITLE,
        description: process.env.SWAG_PAGE_DESC,
        version: process.env.SWAG_VERSION,
    },
    host: process.env.SWAG_HOST,
    basePath: process.env.SWAG_BASE_PATH,
    schemes: ["http", "https"],
    consumes: ["application/json"],
    produces: ["application/json"],
    paths: {},
    parameters: {
        page: {
            description: "Which page of results to return",
            type: "integer",
            in: "query",
            name: "page",
            minimum: 1,
            default: 1,
        },
        limit: {
            description: "How many results to return",
            type: "integer",
            in: "query",
            name: "limit",
            minimum: 1,
            maximum: 100,
            default: parseInt(process.env.DEFAULT_LIMIT),
        },
    },
};

interface IOptions {
    path: string;
    method: "get" | "post" | "put" | "delete" | "head";
    middlewares?: any[];
    authenticationRequired?: boolean;
    swagger?: swaggerMethod;
}

export default function routable(options: IOptions) {
    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) => {
        console.info(
            `Setting up endpoint ${options.method.toUpperCase()}  \t/api${
                options.path
            }\t->\t${target.constructor.name}.${propertyKey}`
        );

        const origFunc = descriptor.value;
        let swaggerPath = options.path.replaceAll(/\:(\w+)/gi, "{$1}");
        if (options.swagger) {
            swaggerDeff.paths[swaggerPath] = {
                [options.method]: {
                    ...options.swagger,
                    tags: target.constructor.tags ?? ["Other"],
                } as swaggerMethod,
            } as swaggerPath;
        } else {
            swaggerDeff.paths[options.path] = {
                [options.method]: {
                    tags: ["Undocumented", ...(target.constructor.tags ?? [])],
                    type: "Unknown",
                } as swaggerMethod,
            } as swaggerPath;
        }

        descriptor.value = async function (...args: any) {
            let request = args[0] as Request;
            let response = args[1] as Response;
            let headers = request.headers;

            console.log(
                `${request.method.toUpperCase()} ${request.url.toLocaleLowerCase()}`
            );

            if (options.authenticationRequired) {
                let jwt: JWTPayload;

                if (headers.authorization) {
                    jwt = new JWTPayload(
                        JWT.decode(headers.authorization.split(" ")[1].trim())
                    );
                } else {
                    response.sendStatus(403).send("Auth Header Required");
                    return;
                }

                //auth header is in format "Bearer $JWT"
                if (
                    headers.authorization
                        .split(" ")[0]
                        .trim()
                        .toLocaleLowerCase() !== "bearer"
                ) {
                    //auth header is malformed
                    response.sendStatus(400).send("Invalid auth header");
                    return;
                }

                let encodedJwt = headers.authorization.split(" ")[1];
                if (!JWT.verify(encodedJwt, process.env.JWT_SECRET || "", {})) {
                    //JWT is invalid, tampered or corrupt
                    response.sendStatus(403).send("Invalid Token");
                    return;
                }

                // if (payload.exp.getTime() < new Date().getTime() / 1000) {
                //     //JWT is expired
                //     response.sendStatus(403).send("Expired Token");
                //     return;
                // }

                origFunc(request, response, jwt);
            }

            origFunc(request, response);
        };

        appRouter[options.method](`/api${options.path}`, descriptor.value);
        return descriptor;
    };
}
