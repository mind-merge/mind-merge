export class ReferencedFile {
    content: string;
    markdownFormat: string;
    mimeType: string;
    path: string;

    constructor(path: string, content: string, mimeType: string, markdownFormat: string) {
        this.path = path;
        this.content = content;
        this.mimeType = mimeType;
        this.markdownFormat = markdownFormat;
    }
}