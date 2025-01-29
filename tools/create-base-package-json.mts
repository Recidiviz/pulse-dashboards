import fs from "fs/promises";
import path from "path";

const projectRoot = process.argv[2];
const rootDir = process.env.NX_WORKSPACE_ROOT ?? "";

const projectPackagePath = path.join(projectRoot, "package.json");
const repoPackagePath = path.join(rootDir, "package.json");

const repoPackageContents = JSON.parse(
  await fs.readFile(repoPackagePath, { encoding: "utf8" }),
);

const projectPackageJsonContents = {
  dependencies: {
    // these are not parts of the application but we use them in the docker container
    extensionless: repoPackageContents.dependencies.extensionless,
    prisma: repoPackageContents.dependencies.prisma,
  },
};

await fs.writeFile(
  projectPackagePath,
  JSON.stringify(projectPackageJsonContents, undefined, 2),
);
