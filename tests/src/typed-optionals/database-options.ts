import { IsString, IsInt, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BindOption } from '../../../lib';

export class ConnectionPoolOptions {
    @IsInt()
    @Min(1)
    @Max(100)
    min!: number;

    @IsInt()
    @Min(1)
    @Max(500)
    max!: number;

    @IsOptional()
    @IsInt()
    @Min(1000)
    timeout?: number;
}

@BindOption('database')
export class DatabaseOptions {
    @IsString()
    host!: string;

    @IsInt()
    @Min(1)
    @Max(65535)
    port!: number;

    @IsString()
    username!: string;

    @IsString()
    password!: string;

    @IsString()
    database!: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ConnectionPoolOptions)
    pool?: ConnectionPoolOptions;
}
