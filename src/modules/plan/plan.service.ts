import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { LoggerService } from '../logger/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Repository } from 'typeorm';
import { PlanQueryDto } from './dto/plan-query.dto';

@Injectable()
export class PlanService {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Plan) private readonly planRepository: Repository<Plan>,
  ) {}
  async create(createPlanDto: CreatePlanDto, creatorId: string) {
    /**
     * acculy i don't wanna creatorId for create plan (add it to the database)
     * but i try to simulate the big system that have many users and many admins
     */
    const newPlan = new Plan();
    Object.assign(newPlan, createPlanDto);
    newPlan.createdBy = creatorId;
    newPlan.updatedBy = creatorId;
    const savedPlan = await this.planRepository.save(newPlan);
    this.logger.info(
      `Created plan by user ${creatorId}, Plan id ${savedPlan.id}`,
    );
    return {
      data: {
        plan: savedPlan,
      },
    };
  }

  async findAllForAdmin(query: PlanQueryDto) {
    const { page, limit, deleted } = query;
    const plans = await this.planRepository.find({
      withDeleted: deleted,
      skip: (page - 1) * limit,
      take: limit + 1,
    });
    return {
      data: {
        plans: plans.slice(0, limit),
      },
      meta: {
        limit,
        page,
        hasNext: plans.length > limit,
        hasPrevious: page > 1,
      },
    };
  }

  async findOneForAdmin(id: string) {
    const plan = await this.planRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!plan) {
      throw new BadRequestException('Plan not found');
    }
    return {
      data: {
        plan,
      },
    };
  }

  async update(id: string, updatePlanDto: UpdatePlanDto, userId: string) {
    await this.planRepository.update(id, {
      ...updatePlanDto,
      updatedBy: userId,
    });
    this.logger.info(
      `Updated plan by user ${userId}, Plan id ${id} Updated containts ${JSON.stringify(
        updatePlanDto,
      )}`,
    );
    return {
      data: {
        message: 'Plan updated successfully',
      },
    };
  }

  async remove(id: string, userId: string) {
    await this.planRepository.delete(id);
    this.logger.info(`Deleted plan by user ${userId}, Plan id ${id}`);
    return {
      message: 'Plan deleted successfully',
    };
  }

  // ************ for public users ************
  async findAll() {
    const plans = await this.planRepository.find({
      where: {
        custom: false,
      },
      order: {
        createdAt: 'ASC',
      },
      select: [
        'id',
        'name',
        'monthlyPrice',
        'yearlyPrice',
        'description',
        'features',
      ],
    });
    return {
      data: {
        plans,
      },
      meta: {
        total: plans?.length,
      },
    };
  }

  async findOne(id: string) {
    const plan = await this.planRepository.findOne({
      where: { id, custom: false },
      select: [
        'id',
        'name',
        'monthlyPrice',
        'yearlyPrice',
        'description',
        'features',
      ],
    });
    if (!plan) {
      throw new BadRequestException('Plan not found');
    }
    return {
      data: {
        plan,
      },
    };
  }
  // ************ for internal work ************
  async findPlanById(planId: string) {
    const plan = await this.planRepository.findOneBy({
      id: planId,
    });
    if (!plan) {
      throw new BadRequestException('Plan not found');
    }
    return plan;
  }
}
