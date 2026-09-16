import { Types } from 'mongoose';
import { SystemSetting, ISystemSetting } from '../models/systemSetting.model';
import { AuditLog } from '../models/auditLog.model';

interface PublicConfigResponse {
  isFreeModeEnabled: boolean;
  freeModeBannerMessage: string;
}

class SystemSettingService {
  private cachedSettings: ISystemSetting | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION_MS = 30 * 1000; // 30 secondes de cache en mémoire

  async getSettings(): Promise<ISystemSetting> {
    const now = Date.now();
    if (this.cachedSettings && now < this.cacheExpiry) {
      return this.cachedSettings;
    }

    let settings = await SystemSetting.findOne({ key: 'global_config' });

    if (!settings) {
      settings = await SystemSetting.create({
        key: 'global_config',
        isFreeModeEnabled: true,
        freeModeBannerMessage:
          'Offre de lancement : Toutes les fonctionnalités professionnelles sont actuellement 100% gratuites.',
      });
    }

    this.cachedSettings = settings;
    this.cacheExpiry = now + this.CACHE_DURATION_MS;

    return settings;
  }

  async isFreeModeActive(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.isFreeModeEnabled;
  }

  async getPublicConfig(): Promise<PublicConfigResponse> {
    const settings = await this.getSettings();
    return {
      isFreeModeEnabled: settings.isFreeModeEnabled,
      freeModeBannerMessage: settings.freeModeBannerMessage,
    };
  }

  async updateFreeMode(
    adminId: string,
    isFreeModeEnabled: boolean,
    freeModeBannerMessage?: string,
    adminIp?: string
  ): Promise<ISystemSetting> {
    const settings = await this.getSettings();

    const oldState = settings.isFreeModeEnabled;
    settings.isFreeModeEnabled = isFreeModeEnabled;
    if (freeModeBannerMessage !== undefined) {
      settings.freeModeBannerMessage = freeModeBannerMessage;
    }
    settings.updatedBy = new Types.ObjectId(adminId);

    await settings.save();

    // Invalidation et rafraîchissement immédiat du cache
    this.cachedSettings = settings;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION_MS;

    // Traçabilité obligatoire dans le journal d'audit
    await AuditLog.create({
      actor: {
        userId: new Types.ObjectId(adminId),
        ip: adminIp,
      },
      action: 'TOGGLE_FREE_MODE',
      resource: 'SystemSetting',
      resourceId: settings._id.toString(),
      metadata: {
        previousState: oldState,
        newState: isFreeModeEnabled,
        freeModeBannerMessage: settings.freeModeBannerMessage,
      },
    });

    return settings;
  }
}

export const systemSettingService = new SystemSettingService();
