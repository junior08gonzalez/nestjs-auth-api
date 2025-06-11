import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { In, Repository } from 'typeorm';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Rol } from 'src/roles/rol.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Rol) private rolesRepository: Repository<Rol>,
    private jwtService: JwtService, // Assuming you have JwtService for token generation
  ) {}

  async register(user: RegisterAuthDto) {
    const emailExists = await this.usersRepository.findOneBy({ email: user.email });
    if (emailExists) {
      //409 conflict
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    }
    const phoneExists = await this.usersRepository.findOneBy({ phone: user.phone });
    if (phoneExists) {
      throw new HttpException('Phone number already exists', HttpStatus.CONFLICT);
    }
    const newUser = this.usersRepository.create(user);
    let rolesIds = [];
    if (user.rolesIds !== undefined || user.rolesIds !== null) {
      rolesIds = user.rolesIds;
    } else {
      rolesIds = ['CLIENT'];
    }
    const roles = await this.rolesRepository.findBy({ id: In(rolesIds) });
    newUser.roles = roles;
    const userSave = await this.usersRepository.save(newUser);
    const rolesFound = userSave.roles.map((rol) => rol.id);
    const payload = { id: userSave.id, name: userSave.name, roles: rolesFound };
    const token = this.jwtService.sign(payload);
    const data = {
      user: userSave,
      token: 'Bearer ' + token,
    };
    delete data.user.password;
    return data;
  }

  async login(loginData: LoginAuthDto) {
    const { email, password } = loginData;

    const userFound = await this.usersRepository.findOne({
      where: { email: email },
      relations: ['roles'],
    });
    if (!userFound) {
      //404 not found
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);
    }
    const isPasswordValid = await compare(password, userFound.password);
    if (!isPasswordValid) {
      // 403 forbidden
      throw new HttpException('Invalid password', HttpStatus.FORBIDDEN);
    }
    const rolesIds = userFound.roles.map((rol) => rol.id);
    const payload = { id: userFound.id, name: userFound.name, roles: rolesIds };
    const token = this.jwtService.sign(payload);
    const data = {
      user: userFound,
      token: 'Bearer ' + token,
    };
    delete data.user.password; // Remove password from the response
    return data;
  }
}
