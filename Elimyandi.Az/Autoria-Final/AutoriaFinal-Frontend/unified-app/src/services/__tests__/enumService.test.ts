import { 
  getEnumLabel, 
  getEnumUiConfig, 
  getEnumBadgeClasses, 
  getEnumValues,
  isValidEnumValue,
  FALLBACK_ENUMS 
} from '../enumService';

describe('Enum Service Tests', () => {
  describe('getEnumLabel', () => {
    it('should return correct label for valid enum value', () => {
      expect(getEnumLabel('AuctionStatus', 1)).toBe('Scheduled');
      expect(getEnumLabel('BidStatus', 0)).toBe('Placed');
      expect(getEnumLabel('CarCondition', 1)).toBe('RunAndDrive');
    });

    it('should return fallback for unknown enum type', () => {
      expect(getEnumLabel('UnknownEnum', 1)).toBe('Unknown (1)');
    });

    it('should return fallback for unknown enum value', () => {
      expect(getEnumLabel('AuctionStatus', 999)).toBe('Unknown (999)');
    });

    it('should handle string values', () => {
      expect(getEnumLabel('AuctionStatus', '1')).toBe('Scheduled');
    });
  });

  describe('getEnumUiConfig', () => {
    it('should return correct UI config for valid enum', () => {
      const config = getEnumUiConfig('AuctionStatus', 1);
      expect(config.color).toBe('yellow');
      expect(config.bgColor).toBe('bg-yellow-100');
      expect(config.textColor).toBe('text-yellow-800');
    });

    it('should return default config for unknown enum', () => {
      const config = getEnumUiConfig('UnknownEnum', 1);
      expect(config.color).toBe('gray');
      expect(config.bgColor).toBe('bg-gray-100');
      expect(config.textColor).toBe('text-gray-800');
    });
  });

  describe('getEnumBadgeClasses', () => {
    it('should return correct badge classes', () => {
      const classes = getEnumBadgeClasses('AuctionStatus', 1);
      expect(classes).toContain('bg-yellow-100');
      expect(classes).toContain('text-yellow-800');
      expect(classes).toContain('inline-flex');
    });
  });

  describe('getEnumValues', () => {
    it('should return all enum values for a type', () => {
      const values = getEnumValues('AuctionStatus');
      expect(values).toHaveLength(6);
      expect(values[0]).toEqual({ value: '0', label: 'Draft' });
    });
  });

  describe('isValidEnumValue', () => {
    it('should validate enum values correctly', () => {
      expect(isValidEnumValue('AuctionStatus', 1)).toBe(true);
      expect(isValidEnumValue('AuctionStatus', 999)).toBe(false);
      expect(isValidEnumValue('UnknownEnum', 1)).toBe(false);
    });
  });

  describe('Fallback Enums', () => {
    it('should have all required enum types', () => {
      expect(FALLBACK_ENUMS).toHaveProperty('AuctionStatus');
      expect(FALLBACK_ENUMS).toHaveProperty('BidStatus');
      expect(FALLBACK_ENUMS).toHaveProperty('CarCondition');
      expect(FALLBACK_ENUMS).toHaveProperty('DamageType');
      expect(FALLBACK_ENUMS).toHaveProperty('FuelType');
      expect(FALLBACK_ENUMS).toHaveProperty('Transmission');
      expect(FALLBACK_ENUMS).toHaveProperty('TitleType');
      expect(FALLBACK_ENUMS).toHaveProperty('DriveTrain');
    });

    it('should have correct enum values', () => {
      expect(FALLBACK_ENUMS.AuctionStatus['0']).toBe('Draft');
      expect(FALLBACK_ENUMS.AuctionStatus['1']).toBe('Scheduled');
      expect(FALLBACK_ENUMS.AuctionStatus['2']).toBe('Running');
      expect(FALLBACK_ENUMS.CarCondition['1']).toBe('RunAndDrive');
    });
  });
});
