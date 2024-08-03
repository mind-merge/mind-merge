import {FS} from "liquidjs";
import { readFile as nodeReadFile, readFileSync as nodeReadFileSync, stat, statSync } from 'node:fs';
import { extname, join, dirname as nodeDirname, resolve as nodeResolve, relative, sep } from 'node:path';

export class TemplateFileSystem implements FS {
    sep: string = sep;
    private readonly root: string;

    constructor(root: string) {
        this.root = nodeResolve(root);

        // Bind all methods to ensure they have access to 'this'
        this.contains = this.contains.bind(this);
        this.dirname = this.dirname.bind(this);
        this.exists = this.exists.bind(this);
        this.existsSync = this.existsSync.bind(this);
        this.fallback = this.fallback.bind(this);
        this.readFile = this.readFile.bind(this);
        this.readFileSync = this.readFileSync.bind(this);
        this.resolve = this.resolve.bind(this);
    }

    contains(root: string, file: string): boolean {
        root = this.ensureWithinRoot(root);
        file = this.ensureWithinRoot(file);
        root = root.endsWith(sep) ? root : root + sep;
        return file.startsWith(root);
    }

    dirname(file: string): string {
        return nodeDirname(this.ensureWithinRoot(file));
    }

    async exists(filepath: string): Promise<boolean> {
        const safePath = this.ensureWithinRoot(filepath);
        return new Promise((resolve) => {
            stat(safePath, (err) => {
                resolve(!err);
            });
        });
    }

    existsSync(filepath: string): boolean {
        const safePath = this.ensureWithinRoot(filepath);
        try {
            statSync(safePath);
            return true;
        } catch {
            return false;
        }
    }

    fallback(file: string): string | undefined {
        try {
            // eslint-disable-next-line unicorn/prefer-module
            const resolvedPath = require.resolve(file);
            this.ensureWithinRoot(resolvedPath);
            return resolvedPath;
        } catch {
            return undefined;
        }
    }

    readFile(filepath: string): Promise<string> {
        const safePath = this.ensureWithinRoot(filepath);
        return new Promise((resolve, reject) => {
            nodeReadFile(safePath, 'utf8', (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    readFileSync(filepath: string): string {
        const safePath = this.ensureWithinRoot(filepath);
        return nodeReadFileSync(safePath, 'utf8');
    }

    resolve(dir: string, file: string, ext: string): string {
        if (!extname(file)) file += ext;

        // First, try to resolve with the provided path
        const resolvedPath = this.ensureWithinRoot(join(dir, file));
        if (this.existsSync(resolvedPath)) {
            return resolvedPath;
        }

        // If not found, check for the org-folder/package-folder pattern
        const parts = file.split(sep);
        if (parts.length >= 2) {
            const orgFolder = parts[0];
            const packageFolder = parts[1];
            const restOfPath = parts.slice(2).join(sep);

            const alternativePath = this.ensureWithinRoot(join(
                'node_modules',
                orgFolder,
                packageFolder,
                'ai',
                'prompts',
                'partials',
                restOfPath
            ));

            if (this.existsSync(alternativePath)) {
                return alternativePath;
            }
        }

        // If still not found, return the original resolved path
        return resolvedPath;
    }

    private ensureWithinRoot(filepath: string): string {
        const resolvedPath = nodeResolve(this.root, filepath);
        const relativePath = relative(this.root, resolvedPath);
        if (relativePath.startsWith('..') || relativePath.startsWith(sep)) {
            throw new Error('Access denied: Attempted to access file outside of root directory');
        }

        return resolvedPath;
    }
}