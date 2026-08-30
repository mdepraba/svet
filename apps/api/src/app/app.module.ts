import { Module } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ZodValidationPipe } from 'nestjs-zod';
import { AccessTokenGuard } from '@/guard/access-token.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@/shared/prisma.module';
import { JobsModule } from '@/jobs/jobs.module';
import { OwnerModule } from '@/modules/owners/owner.module';
import { PatientModule } from '@/modules/patients/patient.module';
import { ProductModule } from '@/modules/products/product.module';
import { ProductCategoryModule } from '@/modules/products/product-categories/product-category.module';
import { TreatmentModule } from '@/modules/treatments/treatment.module';
import { TreatmentCategoryModule } from '@/modules/treatments/treatment-category/treatment-category.module';
import { UnitModule } from '@/modules/units/unit.module';
import { TaxModule } from '@/modules/tax/tax.module';
import { RoleModule } from '@/modules/roles/role.module';
import { UserModule } from '@/modules/users/user.module';
import { VisitModule } from '@/modules/visits/visit.module';
import { VisitDetailModule } from '@/modules/visits/visit-details/visit-detail.module';
import { VisitProductAssocModule } from '@/modules/visits/visit-details/visit-product-assocs/visit-product-assoc.module';
import { VisitTreatmentAssocModule } from '@/modules/visits/visit-details/visit-treatment-assocs/visit-treatment-assoc.module';
import { MedicalRecordModule } from '@/modules/medical-records/medical-record.module';
import { MedicalUsageModule } from '@/modules/medical-records/medical-usages/medical-usage.module';
import { InvoiceModule } from '@/modules/invoices/invoice.module';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { SettingModule } from '@/modules/settings/setting.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { AuthModule } from '@/modules/auth';

/**
 * Root module: every feature module, plus the two globals that make validation
 * and auth opt-*out* — `ZodValidationPipe` and `AccessTokenGuard`.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // The app is served from the workspace root, so the root `.env` is what
      // loads by default. `apps/api/.env` is listed second for the values that
      // live next to the API itself; first file to define a key wins.
      envFilePath: ['.env', 'apps/api/.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    JobsModule,
    OwnerModule,
    PatientModule,
    ProductModule,
    ProductCategoryModule,
    TreatmentModule,
    TreatmentCategoryModule,
    UnitModule,
    TaxModule,
    RoleModule,
    UserModule,
    VisitModule,
    VisitDetailModule,
    VisitProductAssocModule,
    VisitTreatmentAssocModule,
    MedicalRecordModule,
    MedicalUsageModule,
    InvoiceModule,
    InventoryModule,
    SettingModule,
    DashboardModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Global: every module's routes are closed unless the handler says
    // `@Public()`. It resolves the caller through AuthModule's exported port.
    { provide: APP_GUARD, useClass: AccessTokenGuard },
  ],
})
export class AppModule {}
