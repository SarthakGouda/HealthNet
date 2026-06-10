export class User{
    Name: string;
    Email: string;
    Password: string;
    ConfirmPassword: string;
    Phone: string;
    RoleName: string;

    constructor(name: string, email: string, password: string, confirmPassword: string, phoneNumber: string, role: string){
        this.Name = name;
        this.Email = email;
        this.Password = password;
        this.ConfirmPassword = confirmPassword;
        this.Phone = phoneNumber;
        this.RoleName = role;
    }
}