const { FileSystemObject } = require("fso");
const uuid = require("uuid/v5");
const repositories = require("../repositories.json");
const packageJson = require("../package.json");

const njsprojBaseDir = "vs";
const root = new FileSystemObject(__dirname, "..");
const njsprojBase = root.join(njsprojBaseDir);
const namespace = "61629e7f-5271-489f-869f-adc76c45bd7b";

/**
 * @param {string} slnGuid
 * @param {Array<{name: string; guid: string}>} projects
 */
const genSln = (slnGuid, projects) => `Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio 15
VisualStudioVersion = 15.0.27130.2027
MinimumVisualStudioVersion = 10.0.40219.1
${
    projects.map(
        project =>
            `Project("{9092AA53-FB77-4645-B42D-1CCCA6BD08BD}") = "${project.name}", "${njsprojBaseDir}\\${project.name}.njsproj", "{${project.guid}}"\nEndProject`,
    ).join("\n")
}
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
    GlobalSection(ProjectConfigurationPlatforms) = postSolution
${
    projects.map(project =>
        ["Debug", "Release"].map(mode =>
            `		{${project.guid}}.${mode}|Any CPU.ActiveCfg = ${mode}|Any CPU\n` +
            `		{${project.guid}}.${mode}|Any CPU.Build.0 = ${mode}|Any CPU`,
        ).join("\n"),
    ).join("\n")
}
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ExtensibilityGlobals) = postSolution
		SolutionGuid = {${slnGuid}}
	EndGlobalSection
EndGlobal
`;

/**
 * @param {string} name
 * @param {string} guid
 * @param {FileSystemObject} projRoot
 */
const genProj = (name, guid, projRoot) => {
  const entries = projRoot.filteredChildrenAllSync(["node_modules", ".git"]);
  const dirs = entries.filter(entry => !entry.isFileSync());
  const files = entries.filter(entry => entry.isFileSync());
  const tsFiles = files.filter(entry => [".ts", ".tsx"].includes(entry.extname()));
  const jsFiles = files.filter(entry => [".js", ".jsx"].includes(entry.extname()));
  const otherFiles = files.filter(entry => ![".js", ".jsx", ".ts", ".tsx"].includes(entry.extname()));
  return `<?xml version="1.0" encoding="utf-8"?>
<Project DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003" ToolsVersion="4.0">
  <PropertyGroup>
    <Configuration Condition=" '$(Configuration)' == '' ">Debug</Configuration>
    <SchemaVersion>2.0</SchemaVersion>
    <ProjectGuid>{${guid}}</ProjectGuid>
    <ProjectHome>..\\packages\\${name}\\</ProjectHome>
    <ProjectView>ShowAllFiles</ProjectView>
    <StartupFile />
    <WorkingDirectory>.</WorkingDirectory>
    <OutputPath>.</OutputPath>
    <ProjectTypeGuids>{3AF33F2E-1136-4D97-BBB7-1795711AC8B8};{9092AA53-FB77-4645-B42D-1CCCA6BD08BD}</ProjectTypeGuids>
    <TypeScriptSourceMap>true</TypeScriptSourceMap>
    <TypeScriptModuleKind>CommonJS</TypeScriptModuleKind>
    <EnableTypeScript>true</EnableTypeScript>
    <TypeScriptToolsVersion>Latest</TypeScriptToolsVersion>
    <VisualStudioVersion Condition="'$(VisualStudioVersion)' == ''">14.0</VisualStudioVersion>
    <VSToolsPath Condition="'$(VSToolsPath)' == ''">$(MSBuildExtensionsPath32)\\Microsoft\\VisualStudio\\v$(VisualStudioVersion)</VSToolsPath>
    <LastActiveSolutionConfig>Debug|Any CPU</LastActiveSolutionConfig>
    <StartWebBrowser>False</StartWebBrowser>
  </PropertyGroup>
  <ItemGroup>
${
  jsFiles.map(entry => `    <JavaScriptCompile Include="${projRoot.relative(entry)}" />`).concat(
    tsFiles.map(entry => `    <TypeScriptCompile Include="${projRoot.relative(entry)}" />`),
  ).concat(
    otherFiles.map(entry => `    <Content Include="${projRoot.relative(entry)}" />`),
  ).join("\n")
}
  </ItemGroup>
  <ItemGroup>
${dirs.map(entry => `    <Folder Include="${projRoot.relative(entry)}" />`).join("\n")}
  </ItemGroup>
  <Import Project="$(MSBuildToolsPath)\\Microsoft.Common.targets" Condition="Exists('$(MSBuildExtensionsPath)\\$(MSBuildToolsVersion)\\Microsoft.Common.props')" />
  <!--Do not delete the following Import Project.  While this appears to do nothing it is a marker for setting TypeScript properties before our import that depends on them.-->
  <Import Project="$(MSBuildExtensionsPath32)\\Microsoft\\VisualStudio\\v$(VisualStudioVersion)\\TypeScript\\Microsoft.TypeScript.targets" Condition="False" />
  <Import Project="$(VSToolsPath)\\Node.js Tools\\Microsoft.NodejsTools.targets" />
</Project>
`;
};

/**
 * @param {string[]} repos
 */
async function genAllSln(repos) {try{
    /** @type {Array<{name: string; guid: string}>} */
    const projects = [];

    for (const repo of repos) {
        const name = repo.split("/")[1];
        const guid = uuid(name, namespace).toUpperCase();
        projects.push({ name, guid });
    }

    const sln = genSln(uuid("sln", namespace).toUpperCase(), projects);
    await root.join(`${packageJson.name}.sln`).writeFile(sln);

    await njsprojBase.mkdirp();
    for (const project of projects) {
        const njsproj = genProj(project.name, project.guid, root.join("packages", project.name));
        await njsprojBase.join(`${project.name}.njsproj`).writeFile(njsproj);
    }
}catch(e) {console.error(e)}
}

genAllSln(repositories);
