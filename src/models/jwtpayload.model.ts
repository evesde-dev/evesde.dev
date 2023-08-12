export class JWTPayload {
    public name: string;
    public sub: string;
    public exp: Date;

    public constructor(json: any) {
        this.name = json.name;
        this.sub = json.sub;
        this.exp = json.exp;
    }

    public static make(name: string, subject: string): JWTPayload {
        return new JWTPayload({
            name,
            sub: subject,
            //getTime() returns linux epoch in milliseconds
            //add 1 hour to it
            exp: new Date().getTime() + 60 * 60 * 1000 * 1000,
        });
    }

    public toJSON(): string {
        return JSON.stringify(this);
    }
}
