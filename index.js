import UtilArgs from './util/args.js';
import UtilPath from './util/path.js';
import UtilFs from './util/fs.js';
import UtilIntelligentCompare from './util/intelligent-compare.js';
import UtilCompare from './util/compare.js';
import UtilQueue from './util/queue.js';

const argv = UtilArgs.getArgv();

(async function () {
    // get summary
    const lhsQueue = UtilQueue.createQueue({ concurrency: argv.n });
    const lhsFilePattern = UtilPath.resolve(argv.l, '**/*');
    const lhsFilePaths = await UtilPath.glob(lhsFilePattern);
    const lhsFileSummary = await UtilCompare.getFileSummary(argv.l, lhsFilePaths, lhsQueue);
    const rhsQueue = UtilQueue.createQueue({ concurrency: argv.m });
    const rhsFilePattern = UtilPath.resolve(argv.r, '**/*');
    const rhsFilePaths = await UtilPath.glob(rhsFilePattern);
    const rhsFileSummary = await UtilCompare.getFileSummary(argv.r, rhsFilePaths, rhsQueue);

    // save file summary
    const lhsFileSummaryOutputPath = UtilPath.resolve(argv.o, './file-summary-lhs.json');
    UtilFs.writeJson(lhsFileSummaryOutputPath, lhsFileSummary);
    const rhsFileSummaryOutputPath = UtilPath.resolve(argv.o, './file-summary-rhs.json');
    UtilFs.writeJson(rhsFileSummaryOutputPath, rhsFileSummary);

    // compare summary
    const compareSummary = UtilCompare.getCompareSummary(lhsFileSummary, rhsFileSummary);

    // revalidate compare summary
    const compareRevalidateQueueLhs = UtilQueue.createQueue({ concurrency: argv.n });
    const compareRevalidateQueueRhs = UtilQueue.createQueue({ concurrency: argv.m });
    const compareRevalidateSummary = await UtilCompare.revalidateCompareSummary(compareSummary, compareRevalidateQueueLhs, compareRevalidateQueueRhs);

    // resort compare summary
    const compareResortSummary = UtilCompare.resortCompareSummary(compareRevalidateSummary);

    // save compare summary
    const compareSummaryOutputPath = UtilPath.resolve(argv.o, './compare-summary.json');
    UtilFs.writeJson(compareSummaryOutputPath, compareResortSummary);

    // compare report
    const compareReport = UtilCompare.getCompareReport(compareRevalidateSummary);

    // save compare report
    const compareReportOutputPath = UtilPath.resolve(argv.o, './compare-report.html');
    UtilFs.writeFile(compareReportOutputPath, compareReport);

    // Copy added and removed files to respective directories
    const newDir = UtilPath.resolve(argv.o, './new');
    const deleteDir = UtilPath.resolve(argv.o, './delete');

    // Process each comparison result
    compareResortSummary.forEach(item => {
        if (item.type === 'add') {
            // Copy files from rhs (new files)
            item.rhs.forEach(file => {
                const destPath = UtilPath.resolve(newDir, file.filename);
                UtilFs.copyFile(file.path, destPath);
            });
        } else if (item.type === 'remove') {
            // Copy files from lhs (deleted files)
            item.lhs.forEach(file => {
                const destPath = UtilPath.resolve(deleteDir, file.filename);
                UtilFs.copyFile(file.path, destPath);
            });
        }
    });

    UtilIntelligentCompare.generateModifyMapping(lhsFileSummary, rhsFileSummary, argv.o);
})();
