import _ from 'lodash';
import UtilPath from './path.js';
import UtilFs from './fs.js';

/**
 * Intelligent file compare based on MD5
 * @param {Array} lhsFileSummary - file summary of left-hand side
 * @param {Array} rhsFileSummary - file summary of right-hand side
 */
function intelligentCompare(lhsFileSummary, rhsFileSummary) {
    // create mappings based on MD5
    const lhsMD5Map = _.groupBy(lhsFileSummary, 'md5');
    const rhsMD5Map = _.groupBy(rhsFileSummary, 'md5');

    const result = {
        unchanged: [],  // both file names and file content are unchanged
        renamed: [],    // file names changed, but file content remains unchanged
        modified: [],   // file content changed, but file names remains unchanged
        moved: [],      // both file names and file content are changed
        added: [],      // added files
        deleted: []     // deleted files
    };

    // process left-hand files
    _.each(lhsMD5Map, (lhsFiles, md5) => {
        const rhsFiles = rhsMD5Map[md5];

        if (!rhsFiles) {
            // if files are deleted
            result.deleted.push(...lhsFiles);
        } else {
            // if file contents are unchanged, check if it is renamed
            _.each(lhsFiles, (lhsFile) => {
                const rhsFile = _.find(rhsFiles, {filename: lhsFile.filename});

                if (rhsFile) {
                    // if both file names and file content are unchanged
                    result.unchanged.push({
                        lhs: lhsFile,
                        rhs: rhsFile,
                        md5: md5
                    });
                } else {
                    // if file names changed, but file content remains unchanged
                    // let the first matched rhs file to be the target of renaming
                    const rhsFile = rhsFiles[0];
                    result.renamed.push({
                        old: lhsFile,
                        new: rhsFile,
                        md5: md5
                    });

                    // remove proceeded files from rhsFiles
                    rhsFiles.splice(rhsFiles.indexOf(rhsFile), 1);
                    if (rhsFiles.length === 0) {
                        delete rhsMD5Map[md5];
                    }
                }
            });
        }
    });

    // process left right-hand files
    _.each(rhsMD5Map, (rhsFiles, md5) => {
        if (!lhsMD5Map[md5]) {
            // if file is a new added file
            result.added.push(...rhsFiles);
        } else {
            // if file names are same but have different hashes
            _.each(rhsFiles, (rhsFile) => {
                const lhsFile = _.find(lhsFileSummary, {filename: rhsFile.filename});
                if (lhsFile && lhsFile.md5 !== rhsFile.md5) {
                    result.modified.push({
                        old: lhsFile,
                        new: rhsFile,
                        oldMD5: lhsFile.md5,
                        newMD5: rhsFile.md5
                    });
                }
            });
        }
    });

    return result;
}

function generateModifyMapping(lhsFileSummary, rhsFileSummary, outputPath) {
    const comparison = intelligentCompare(lhsFileSummary, rhsFileSummary);

    // generate directory
    const modifyOldDir = UtilPath.resolve(outputPath, './modify/old');
    const modifyNewDir = UtilPath.resolve(outputPath, './modify/new');

    // process files that practically changed (hash changed)
    const modifiedFiles = [];

    _.each(comparison.modified, (item) => {
        const oldPath = UtilPath.resolve(modifyOldDir, item.old.filename);
        const newPath = UtilPath.resolve(modifyNewDir, item.new.filename);

        UtilFs.copyFile(item.old.path, oldPath);
        UtilFs.copyFile(item.new.path, newPath);

        modifiedFiles.push({
            old: item.old.filename,
            new: item.new.filename,
            oldHash: item.oldMD5,
            newHash: item.newMD5
        });
    });

    // generate modified files mappings
    const modifyMappingPath = UtilPath.resolve(outputPath, './analysis.json');
    UtilFs.writeJson(modifyMappingPath, {
        modified: modifiedFiles,
        analysis: {
            unchanged: comparison.unchanged.length,
            renamed: comparison.renamed.length,
            modified: comparison.modified.length,
            added: comparison.added.length,
            deleted: comparison.deleted.length
        }
    });

    // generate renamed files mappings
    const renamedFiles = comparison.renamed.map(item => ({
        hash: item.md5,
        lhs: [item.old],
        rhs: [item.new]
    }));

    const renamedMappingPath = UtilPath.resolve(outputPath, './modify/renamed-files.json');
    UtilFs.writeJson(renamedMappingPath, renamedFiles);

    return modifiedFiles;
}

export default {
    intelligentCompare,
    generateModifyMapping
};
