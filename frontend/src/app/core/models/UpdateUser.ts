export class UpdateUser{
    Name: string;
    Email: string;
    PhoneNumber: string;
    RoleName: string;

    constructor(name: string, email: string, phone: string, role: string){
        this.Name = name;
        this.Email = email;
        this.PhoneNumber = phone;
        this.RoleName = role;
    }
}