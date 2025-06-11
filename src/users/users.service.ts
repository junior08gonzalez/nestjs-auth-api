import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  create(user: CreateUserDto) {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  findAll() {
    return this.userRepository.find({ relations: ['roles'] });
  }

  async update(id: number, user: UpdateUserDto) {
    const userFound = await this.userRepository.findOneBy({ id: id });
    if (!userFound) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const userToUpdate = Object.assign(userFound, user);
    return this.userRepository.save(userToUpdate);
  }

  async uploadFile(file: Express.Multer.File) {
    console.log(file);
    // if (!file) {
    //   throw new HttpException('File not provided', HttpStatus.BAD_REQUEST);
    // }
    // // Here you would typically save the file to a storage service or database
    // // For demonstration, we just return the file information
    // return {
    //   originalname: file.originalname,
    //   filename: file.filename,
    //   mimetype: file.mimetype,
    //   size: file.size,
    // };
  }
}
