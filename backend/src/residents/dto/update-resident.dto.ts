import { PartialType } from '@nestjs/swagger';
import { CreateResidentDto } from './create-resident.dto';

// O PartialType faz a mágica de pegar TUDO do Create (incluindo role/unitRole) e deixar opcional
export class UpdateResidentDto extends PartialType(CreateResidentDto) {}