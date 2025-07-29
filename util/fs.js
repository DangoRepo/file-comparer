import FsExtra from 'fs-extra';
import Path from 'path';

function readFile(file, encoding) {
    if (!file) {
        return;
    }

    return FsExtra.readFileSync(file, encoding);
}

function writeFile (file, content) {
    if (!file) {
        return;
    }

    FsExtra.outputFileSync(file, content, 'utf-8');
}

function readJson(file) {
    if (!file) {
        return;
    }

    return FsExtra.readJsonSync(file, { throws: false });
}

function writeJson (file, content) {
    if (!file) {
        return;
    }

    FsExtra.outputJsonSync(file, content, 'utf-8');
}

function copyFile(src, dest) {
    if (!src || !dest) {
        return;
    }

    // 确保目标目录存在
    const destDir = Path.dirname(dest);
    FsExtra.ensureDirSync(destDir);

    FsExtra.copyFileSync(src, dest);
}

export default {
    readFile,
    writeFile,
    readJson,
    writeJson,
    copyFile
};
