import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
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
const REQUIRED_NOTE = "(required)";

const TEAL = "1F3B38";
const TEAL_SOFT = "4A6E6A";
const GOLD = "B8860B";
const LINE = "C9D9D6";
const FILL = "E8F1EF";
const RED = "B3261E";
const WHITE = "FFFFFF";
const MUTED = "6B7C7A";

function answerLine(underscores: number) {
  return new Paragraph({
    children: [new TextRun({ text: "_".repeat(underscores), color: TEAL })],
    spacing: { before: 40, after: 160 },
  });
}

function labelPara(label: string, required: boolean) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 22, color: TEAL }),
      ...(required
        ? [new TextRun({ text: `  ${REQUIRED_NOTE}`, color: RED, size: 18, italics: true })]
        : []),
    ],
    spacing: { before: 140, after: 60 },
  });
}

function optionPara(option: string) {
  return new Paragraph({
    children: [new TextRun({ text: `${AC}  ${option}`, size: 20 })],
    spacing: { after: 40 },
  });
}

function optionsGrid(options: string[]) {
  const rows: TableRow[] = [];
  for (let i = 0; i < options.length; i += 2) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [optionPara(options[i])],
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 20, bottom: 20, left: 60, right: 60 },
          }),
          new TableCell({
            children: [i + 1 < options.length ? optionPara(options[i + 1]) : optionPara("")],
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 20, bottom: 20, left: 60, right: 60 },
          }),
        ],
      }),
    );
  }
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      left: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      right: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: LINE },
    },
  });
}

function flagPara(label: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 22, color: TEAL }),
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
    tableHeader: true,
    children: FAMILY_TABLE_HEADERS.map((h) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, size: 16, color: WHITE })],
          }),
        ],
        shading: { type: ShadingType.CLEAR, fill: TEAL },
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
      }),
    ),
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
      top: { style: BorderStyle.SINGLE, size: 4, color: TEAL },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL },
      left: { style: BorderStyle.SINGLE, size: 4, color: TEAL },
      right: { style: BorderStyle.SINGLE, size: 4, color: TEAL },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: LINE },
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
      return [
        labelPara(field.label, field.required),
        answerLine(70),
        answerLine(70),
        answerLine(70),
      ];
    case "repeater":
      return [
        labelPara(field.label, field.required),
        new Paragraph({
          children: [
            new TextRun({
              text: "List each member of the household.",
              size: 18,
              italics: true,
              color: MUTED,
            }),
          ],
          spacing: { after: 80 },
        }),
        familyMembersTable(),
      ];
    default:
      return [labelPara(field.label, field.required), answerLine(70)];
  }
}

function sectionHeading(title: string) {
  return new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 24, color: TEAL })],
    shading: { type: ShadingType.CLEAR, fill: FILL },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 2 } },
    spacing: { before: 260, after: 120 },
  });
}

export function buildResidentFormDoc(
  fields: FormFieldConfig[],
  vicariates: Vicariate[],
  logo?: Uint8Array | null,
): Document {
  const enabled = fields.filter((f) => f.enabled);
  const vicariateNames = vicariates.map((v) => v.name);
  const parishNames = vicariates.flatMap((v) => v.parishes.map((p) => p.name));
  const groups = groupBySection(enabled);

  const children: (Paragraph | Table)[] = [];

  if (logo) {
    children.push(
      new Paragraph({
        children: [new ImageRun({ type: "png", data: logo, transformation: { width: 96, height: 96 } })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "BEC Baseline Family Profiling", bold: true, size: 40, color: TEAL }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "DIOCESE OF ILIGAN", bold: true, size: 24, color: GOLD })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Family Data Entry Form", size: 22, color: TEAL_SOFT })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 4 } },
    }),
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Encoder: ", bold: true, size: 20, color: TEAL }),
                    new TextRun({ text: "_______________________", size: 20, color: TEAL }),
                  ],
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 0, right: 60 },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Date: ", bold: true, size: 20, color: TEAL }),
                    new TextRun({ text: "_______________________", size: 20, color: TEAL }),
                  ],
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 0, right: 0 },
            }),
          ],
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
    new Paragraph({
      children: [new TextRun({ text: "* required field", size: 18, italics: true, color: RED })],
      spacing: { before: 40, after: 120 },
    }),
  );

  for (const group of groups) {
    children.push(sectionHeading(group.section));
    for (const field of group.fields) {
      children.push(...fieldChildren(field, vicariateNames, parishNames));
    }
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Generated from the BEC Baseline Family Profiling system — Diocese of Iligan.",
          size: 16,
          italics: true,
          color: MUTED,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 320, after: 0 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
    }),
  );

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

async function fetchLogo(): Promise<Uint8Array | null> {
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function downloadResidentFormDoc(): Promise<void> {
  const [fields, vicariates, logo] = await Promise.all([
    getFormFields(),
    getVicariates(),
    fetchLogo(),
  ]);
  const doc = buildResidentFormDoc(fields, vicariates, logo);
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