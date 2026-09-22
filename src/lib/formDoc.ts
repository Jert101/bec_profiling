import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { FormFieldConfig, Vicariate } from "./types";
import { getFormFields, getVicariates } from "./residents";
import { groupBySection } from "./formConfig";

const AC = "☐";
const REQUIRED_NOTE = " * required";

function answerLine(underscores: number) {
  return new Paragraph({
    children: [new TextRun({ text: "_".repeat(underscores), color: "1F3B38" })],
    spacing: { before: 40, after: 160 },
  });
}

function labelPara(label: string, required: boolean) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 22 }),
      ...(required ? [new TextRun({ text: REQUIRED_NOTE, color: "B3261E", size: 18, italics: true })] : []),
    ],
    spacing: { before: 120, after: 60 },
  });
}

function optionPara(option: string) {
  return new Paragraph({
    children: [new TextRun({ text: `${AC}  ${option}`, size: 20 })],
    spacing: { after: 40 },
  });
}

function optionsGrid(options: string[]) {
  const cells: TableRow[] = [];
  for (let i = 0; i < options.length; i += 2) {
    const left = optionPara(options[i]);
    const right = i + 1 < options.length ? optionPara(options[i + 1]) : optionPara("");
    cells.push(
      new TableRow({
        children: [
          new TableCell({
            children: [left],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [right],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    );
  }
  return new Table({
    rows: cells,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function flagPara(label: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 22 }),
      new TextRun({ text: "   ", size: 20 }),
      new TextRun({ text: `${AC} Yes`, size: 20 }),
      new TextRun({ text: "        ", size: 20 }),
      new TextRun({ text: `${AC} No`, size: 20 }),
    ],
    spacing: { before: 120, after: 160 },
  });
}

const FAMILY_TABLE_HEADERS = [
  "Full name",
  "Relationship",
  "Sex",
  "Age",
  "Occupation",
  "Family member type",
  "Sacraments received",
];

const FAMILY_EMPTY_ROWS = 5;

function familyMembersTable() {
  const header = new TableRow({
    children: FAMILY_TABLE_HEADERS.map((h) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, size: 16 })],
          }),
        ],
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
      }),
    ),
    tableHeader: true,
  });
  const body = Array.from({ length: FAMILY_EMPTY_ROWS }, () =>
    new TableRow({
      children: Array.from({ length: FAMILY_TABLE_HEADERS.length }, () =>
        new TableCell({
          children: [new Paragraph({ children: [] })],
          margins: { top: 120, bottom: 120, left: 60, right: 60 },
        }),
      ),
    }),
  );
  return new Table({
    rows: [header, ...body],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "1F3B38" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "1F3B38" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "1F3B38" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "1F3B38" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "B7C9C7" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "B7C9C7" },
    },
  });
}

function fieldChildren(
  field: FormFieldConfig,
  vicariateNames: string[],
  parishNames: string[],
): (Paragraph | Table)[] {
  const options = (() => {
    if (field.name === "vicariate") return vicariateNames;
    if (field.name === "parish") return parishNames;
    return field.options ?? [];
  })();

  switch (field.type) {
    case "select":
    case "multiselect": {
      if (options.length === 0) {
        return [labelPara(field.label, field.required), answerLine(70)];
      }
      const withOther = [...options, "Other: ______________"];
      return [labelPara(field.label, field.required), optionsGrid(withOther)];
    }
    case "flag":
      return [flagPara(field.label)];
    case "textarea":
      return [labelPara(field.label, field.required), answerLine(70), answerLine(70), answerLine(70)];
    case "repeater":
      return [
        labelPara(field.label, field.required),
        new Paragraph({
          children: [new TextRun({ text: "List each member of the household.", size: 18, italics: true, color: "6B7C7A" })],
          spacing: { after: 80 },
        }),
        familyMembersTable(),
      ];
    default:
      return [labelPara(field.label, field.required), answerLine(70)];
  }
}

export function buildResidentFormDoc(
  fields: FormFieldConfig[],
  vicariates: Vicariate[],
): Document {
  const enabled = fields.filter((f) => f.enabled);
  const vicariateNames = vicariates.map((v) => v.name);
  const parishNames = vicariates.flatMap((v) => v.parishes.map((p) => p.name));
  const groups = groupBySection(enabled);

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [new TextRun({ text: "BEC Baseline Family Profiling", bold: true, size: 40 })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "DIOCESE OF ILIGAN", bold: true, size: 24, color: "1F3B38" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Family Data Entry Form", size: 22, color: "1F3B38" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Encoder: ________________________", size: 20 }),
        new TextRun({ text: "\t\t\t\t", size: 20 }),
        new TextRun({ text: "Date: ________________________", size: 20 }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "* required field", size: 18, italics: true, color: "B3261E" })],
      spacing: { after: 120 },
    }),
  ];

  for (const group of groups) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: group.section, bold: true, size: 26, color: "1F3B38" })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 80 },
      }),
    );
    for (const field of group.fields) {
      children.push(...fieldChildren(field, vicariateNames, parishNames));
    }
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
          },
        },
        children,
      },
    ],
  });
}

export async function downloadResidentFormDoc(): Promise<void> {
  const [fields, vicariates] = await Promise.all([getFormFields(), getVicariates()]);
  const doc = buildResidentFormDoc(fields, vicariates);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "BEC-Family-Profiling-Form.docx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}