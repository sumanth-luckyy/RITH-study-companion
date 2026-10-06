import {
  BranchCodeMapping,
  RollNumberFormatConfig,
  ParsedRollNumber,
  Branch,
} from '../types/academic';

/**
 * Built-in default formats in case database table is empty or offline
 */
export const DEFAULT_ROLL_FORMATS: RollNumberFormatConfig[] = [
  {
    id: 'default-institutional-10',
    name: 'Institutional 10-Character (e.g. 25ME1A4602)',
    pattern: '^(\\d{2})([A-Z]{2})([A-Z0-9]{2})(\\d{4})$',
    year_group_index: 1,
    college_group_index: 2,
    branch_code_group_index: 3,
    roll_group_index: 4,
    century_prefix: 2000,
    sample_roll: '25ME1A4602',
    description: 'Matches standard 10-char format: 25 (joining year) + ME (college code) + 1A (branch code) + 4602 (numeric roll)',
    is_default: true,
    is_active: true,
  },
  {
    id: 'default-prefix-standard',
    name: 'Alternative Direct Prefix (e.g. 25CS042)',
    pattern: '^(\\d{2})([A-Z]{2,4})(\\d{3,4})$',
    year_group_index: 1,
    college_group_index: 0,
    branch_code_group_index: 2,
    roll_group_index: 3,
    century_prefix: 2000,
    sample_roll: '25CS042',
    description: 'Matches legacy / compact format: 25 (year) + CS (branch code) + 042 (roll)',
    is_default: false,
    is_active: true,
  }
];

/**
 * Built-in default branch code mappings
 */
export const DEFAULT_BRANCH_CODE_MAPPINGS: BranchCodeMapping[] = [
  {
    id: 'map-1a',
    code: '1A',
    name: 'Cyber Security',
    description: 'Institutional code for Cyber Security branch',
    is_active: true,
  },
  {
    id: 'map-05',
    code: '05',
    name: 'Computer Science & Engineering',
    description: 'Institutional code for CSE',
    is_active: true,
  },
  {
    id: 'map-42',
    code: '42',
    name: 'Artificial Intelligence & Machine Learning',
    description: 'Institutional code for AI & ML branch',
    is_active: true,
  },
  {
    id: 'map-44',
    code: '44',
    name: 'Data Science',
    description: 'Institutional code for Data Science branch',
    is_active: true,
  },
  {
    id: 'map-04',
    code: '04',
    name: 'Electronics & Communication Engineering',
    description: 'Institutional code for ECE',
    is_active: true,
  },
  {
    id: 'map-cs',
    code: 'CS',
    name: 'Computer Science & Engineering',
    description: 'Standard CSE prefix',
    is_active: true,
  },
  {
    id: 'map-ec',
    code: 'EC',
    name: 'Electronics & Communication Engineering',
    description: 'Standard ECE prefix',
    is_active: true,
  },
];

/**
 * Parses and validates a student roll number against configurable format rules and branch codes.
 * Hierarchy: Department -> Branch -> Academic Year -> Year -> Semester -> Section -> Student
 */
export function parseRollNumber(
  rawRoll: string,
  formats: RollNumberFormatConfig[] = DEFAULT_ROLL_FORMATS,
  branchCodeMappings: BranchCodeMapping[] = DEFAULT_BRANCH_CODE_MAPPINGS,
  branches: Branch[] = []
): ParsedRollNumber {
  const cleanRoll = rawRoll.trim().toUpperCase();

  if (!cleanRoll) {
    return {
      raw: rawRoll,
      isValid: false,
      errorMessage: 'Roll number cannot be empty.',
    };
  }

  // Filter to active formats, sorted with default first
  const activeFormats = (formats.length > 0 ? formats : DEFAULT_ROLL_FORMATS)
    .filter(f => f.is_active)
    .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));

  for (const fmt of activeFormats) {
    try {
      const regex = new RegExp(fmt.pattern, 'i');
      const match = cleanRoll.match(regex);

      if (match) {
        // Extract Year
        let joiningYear: number | undefined;
        if (fmt.year_group_index && fmt.year_group_index > 0 && match[fmt.year_group_index]) {
          const rawYear = parseInt(match[fmt.year_group_index], 10);
          if (!isNaN(rawYear)) {
            joiningYear = rawYear < 100 ? (fmt.century_prefix || 2000) + rawYear : rawYear;
          }
        }

        // Extract College Code
        let collegeCode: string | undefined;
        if (fmt.college_group_index && fmt.college_group_index > 0 && match[fmt.college_group_index]) {
          collegeCode = match[fmt.college_group_index].toUpperCase();
        }

        // Extract Branch Code
        let branchCode: string | undefined;
        if (fmt.branch_code_group_index && fmt.branch_code_group_index > 0 && match[fmt.branch_code_group_index]) {
          branchCode = match[fmt.branch_code_group_index].toUpperCase();
        }

        // Extract Roll Number
        let numericRoll: string | undefined;
        if (fmt.roll_group_index && fmt.roll_group_index > 0 && match[fmt.roll_group_index]) {
          numericRoll = match[fmt.roll_group_index];
        }

        // Resolve branch from mappings
        const mappings = branchCodeMappings.length > 0 ? branchCodeMappings : DEFAULT_BRANCH_CODE_MAPPINGS;
        const mappedCode = mappings.find(
          m => m.is_active && m.code.toUpperCase() === branchCode
        );

        let mappedBranchId: string | undefined = mappedCode?.branch_id ?? undefined;
        let mappedBranchName: string | undefined = mappedCode?.name;

        // Cross-reference with database branches if IDs or names exist
        if (mappedBranchId && branches.length > 0) {
          const b = branches.find(item => item.id === mappedBranchId);
          if (b) mappedBranchName = b.name;
        } else if (mappedBranchName && branches.length > 0) {
          const b = branches.find(item => 
            mappedBranchName!.toLowerCase().includes(item.name.toLowerCase()) ||
            mappedBranchName!.toLowerCase().includes(item.code.toLowerCase())
          );
          if (b) mappedBranchId = b.id;
        }

        return {
          raw: cleanRoll,
          isValid: true,
          joiningYear,
          collegeCode,
          branchCode,
          numericRoll,
          mappedBranchId,
          mappedBranchName: mappedBranchName || (branchCode ? `Branch (${branchCode})` : undefined),
          branchName: mappedBranchName,
          formatName: fmt.name,
        };
      }
    } catch (e) {
      console.warn(`Error evaluating roll format ${fmt.name}:`, e);
    }
  }

  // If no format matched
  const sample = activeFormats[0]?.sample_roll || '25ME1A4602';
  return {
    raw: cleanRoll,
    isValid: false,
    errorMessage: `Invalid Roll Number format. Expected format like "${sample}".`,
  };
}

/**
 * Validates a roll number and returns an error string or null if valid
 */
export function validateRollNumber(
  rollNumber: string,
  existingRolls: string[] = [],
  formats: RollNumberFormatConfig[] = DEFAULT_ROLL_FORMATS
): string | null {
  const clean = rollNumber.trim().toUpperCase();
  if (!clean) return 'Roll number is required.';

  const isDuplicate = existingRolls.some(r => r.trim().toUpperCase() === clean);
  if (isDuplicate) {
    return `Roll number "${clean}" already exists. Roll numbers must be unique.`;
  }

  const parsed = parseRollNumber(clean, formats);
  if (!parsed.isValid) {
    return parsed.errorMessage || 'Invalid roll number format.';
  }

  if (parsed.joiningYear && (parsed.joiningYear < 2000 || parsed.joiningYear > 2099)) {
    return `Invalid joining year ${parsed.joiningYear}. Must be between 2000 and 2099.`;
  }

  return null;
}
