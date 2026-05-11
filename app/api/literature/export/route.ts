import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ExportFormat = "bibtex" | "ris";

type ExportRequest = {
    format?: ExportFormat;
    paperIds?: string[];
};

type Paper = {
    id: string;
    title: string;
    authors: string | null;
    year: number | null;
    venue: string | null;
    publication_date: string | null;
    abstract: string | null;
    doi: string | null;
    url: string | null;
    citation_key: string | null;
    paper_category: string | null;
    export_status: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function safelyReadJson(request: Request) {
    const text = await request.text();

    if (!text.trim()) {
        return {
            ok: false,
            body: null,
            error: "Request body is empty.",
        };
    }

    try {
        return {
            ok: true,
            body: JSON.parse(text),
            error: null,
        };
    } catch {
        return {
            ok: false,
            body: null,
            error: "Invalid JSON body.",
        };
    }
}

function cleanText(value: string | null | undefined) {
    if (!value) return "";

    return value
        .replace(/\s+/g, " ")
        .replace(/[{}]/g, "")
        .replace(/"/g, "'")
        .trim();
}

function buildCitationKey(paper: Paper) {
    if (paper.citation_key && paper.citation_key.trim()) {
        return paper.citation_key.trim().replace(/[^a-zA-Z0-9_:-]/g, "");
    }

    const firstAuthor = extractFirstAuthorLastName(paper.authors);
    const year = paper.year || "year";
    const titleWord = extractFirstMeaningfulTitleWord(paper.title);

    return `${firstAuthor}${year}${titleWord}`.replace(/[^a-zA-Z0-9_:-]/g, "");
}

function extractFirstAuthorLastName(authors: string | null) {
    if (!authors) return "Author";

    const firstAuthor = authors.split(",")[0]?.trim();

    if (!firstAuthor) return "Author";

    const parts = firstAuthor.split(/\s+/);
    const lastName = parts[parts.length - 1];

    return capitalize(lastName || "Author");
}

function extractFirstMeaningfulTitleWord(title: string) {
    const stopWords = new Set([
        "a",
        "an",
        "the",
        "and",
        "or",
        "for",
        "of",
        "in",
        "on",
        "to",
        "with",
        "using",
        "from",
        "by",
        "via",
        "toward",
        "towards",
    ]);

    const word =
        title
            .toLowerCase()
            .split(/[^a-zA-Z0-9]+/)
            .find((item) => item.length > 3 && !stopWords.has(item)) || "Paper";

    return capitalize(word);
}

function capitalize(value: string) {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function authorsToBibTeX(authors: string | null) {
    if (!authors) return "";

    return authors
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean)
        .join(" and ");
}

function authorsToRIS(authors: string | null) {
    if (!authors) return "";

    return authors
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean)
        .map((author) => `AU  - ${author}`)
        .join("\n");
}

function getYearFromPaper(paper: Paper) {
    if (paper.year) return String(paper.year);

    if (paper.publication_date) {
        const date = new Date(paper.publication_date);

        if (!Number.isNaN(date.getTime())) {
            return String(date.getFullYear());
        }
    }

    return "";
}

function paperToBibTeX(paper: Paper) {
    const citationKey = buildCitationKey(paper);

    const fields: string[] = [];

    fields.push(`  title = {${cleanText(paper.title)}}`);

    const authors = authorsToBibTeX(paper.authors);
    if (authors) fields.push(`  author = {${cleanText(authors)}}`);

    const year = getYearFromPaper(paper);
    if (year) fields.push(`  year = {${year}}`);

    if (paper.venue) fields.push(`  journal = {${cleanText(paper.venue)}}`);
    if (paper.doi) fields.push(`  doi = {${cleanText(paper.doi)}}`);
    if (paper.url) fields.push(`  url = {${cleanText(paper.url)}}`);
    if (paper.abstract) fields.push(`  abstract = {${cleanText(paper.abstract)}}`);

    return `@article{${citationKey},\n${fields.join(",\n")}\n}`;
}

function paperToRIS(paper: Paper) {
    const lines: string[] = [];

    lines.push("TY  - JOUR");
    lines.push(`TI  - ${cleanText(paper.title)}`);

    const authors = authorsToRIS(paper.authors);
    if (authors) lines.push(authors);

    const year = getYearFromPaper(paper);
    if (year) lines.push(`PY  - ${year}`);

    if (paper.venue) lines.push(`T2  - ${cleanText(paper.venue)}`);
    if (paper.doi) lines.push(`DO  - ${cleanText(paper.doi)}`);
    if (paper.url) lines.push(`UR  - ${cleanText(paper.url)}`);
    if (paper.abstract) lines.push(`AB  - ${cleanText(paper.abstract)}`);

    lines.push("ER  -");

    return lines.join("\n");
}

function buildExportText(papers: Paper[], format: ExportFormat) {
    if (format === "ris") {
        return papers.map(paperToRIS).join("\n\n");
    }

    return papers.map(paperToBibTeX).join("\n\n");
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        message:
            "Literature export route is working. Use POST with { format: 'bibtex' | 'ris', paperIds: [...] }.",
    });
}

export async function POST(request: Request) {
    try {
        const parsed = await safelyReadJson(request);

        if (!parsed.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    error: parsed.error,
                },
                { status: 400 }
            );
        }

        const body = parsed.body as ExportRequest;

        const format: ExportFormat = body.format === "ris" ? "ris" : "bibtex";
        const paperIds = body.paperIds || [];

        if (!Array.isArray(paperIds) || paperIds.length === 0) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Please provide at least one paper ID.",
                },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from("papers")
            .select(
                `
        id,
        title,
        authors,
        year,
        venue,
        publication_date,
        abstract,
        doi,
        url,
        citation_key,
        paper_category,
        export_status
      `
            )
            .in("id", paperIds);

        if (error) {
            throw error;
        }

        const papers = (data || []) as Paper[];

        const exportText = buildExportText(papers, format);

        return NextResponse.json({
            ok: true,
            format,
            count: papers.length,
            file_name:
                format === "ris"
                    ? "researchos_literature_export.ris"
                    : "researchos_literature_export.bib",
            export_text: exportText,
            papers,
        });
    } catch (error) {
        console.error("Literature export error:", error);

        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown literature export error.",
            },
            { status: 500 }
        );
    }
}