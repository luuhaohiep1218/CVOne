import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import aqp from 'api-query-params';
import { User } from 'src/typeorm/entities/user.entity';
import { ILike, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findAll(
    query: string,
    email: string,
    current: number,
    pageSize: number,
  ) {
    const { filter, sort } = aqp(query);

    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;

    current = current || 1;
    pageSize = pageSize || 10;

    if (typeof email !== 'undefined') {
      filter.email = ILike(`%${email}%`);
    }

    const skip = (current - 1) * pageSize;

    const [results, totalItems] = await this.userRepository.findAndCount({
      where: filter,
      take: pageSize,
      skip: skip,
      order: sort ? sort : undefined,
      select: ['id', 'email'],
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      meta: {
        current: current,
        pageSize: pageSize,
        pages: totalPages,
        total: totalItems,
      },
      results,
      query,
    };
  }
  async findOne(email: string) {
    // Check if the email already exists
    const user = await this.userRepository.findOneBy({
      email: email,
    });
    if (!user) {
      throw new BadRequestException('This email does not exist.');
    }

    return user;
  }

  async remove(id: string) {
    const user = await this.userRepository.findBy({
      id: id,
    });

    if (!user) {
      throw new BadRequestException('This user does not exist.');
    }
    return this.userRepository.delete(id);
  }
}
