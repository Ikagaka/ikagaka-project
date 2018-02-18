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
 */
const genProj = (name, guid) => `<Project DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003" ToolsVersion="4.0">
<PropertyGroup>
  <VisualStudioVersion Condition="'$(VisualStudioVersion)' == ''">14.0</VisualStudioVersion>
  <VSToolsPath Condition="'$(VSToolsPath)' == ''">$(MSBuildExtensionsPath32)\\Microsoft\\VisualStudio\\v$(VisualStudioVersion)</VSToolsPath>
  <Name>${name}</Name>
  <RootNamespace>${name}</RootNamespace>
</PropertyGroup>
<Import Project="$(MSBuildExtensionsPath)\\$(MSBuildToolsVersion)\\Microsoft.Common.props" Condition="Exists('$(MSBuildExtensionsPath)\\$(MSBuildToolsVersion)\\Microsoft.Common.props')" />
<PropertyGroup>
  <Configuration Condition=" '$(Configuration)' == '' ">Debug</Configuration>
  <SchemaVersion>2.0</SchemaVersion>
  <ProjectGuid>${guid}</ProjectGuid>
  <ProjectHome>.</ProjectHome>
  <StartupFile></StartupFile>
  <StartWebBrowser>False</StartWebBrowser>
  <SearchPath>
  </SearchPath>
  <WorkingDirectory>..\\packages\\${name}</WorkingDirectory>
  <OutputPath>..\\packages\\${name}</OutputPath>
  <TargetFrameworkVersion>v4.0</TargetFrameworkVersion>
  <ProjectTypeGuids>{3AF33F2E-1136-4D97-BBB7-1795711AC8B8};{9092AA53-FB77-4645-B42D-1CCCA6BD08BD}</ProjectTypeGuids>
  <TypeScriptToolsVersion>Latest</TypeScriptToolsVersion>
  <EnableTypeScript>true</EnableTypeScript>
</PropertyGroup>
<PropertyGroup Condition=" '$(Configuration)' == 'Debug' ">
  <DebugSymbols>true</DebugSymbols>
</PropertyGroup>
<PropertyGroup Condition=" '$(Configuration)' == 'Release' ">
  <DebugSymbols>true</DebugSymbols>
</PropertyGroup>
<ItemGroup>
  <Content Include="..\\packages\\${name}\\**" Exclude="..\\packages\\${name}\\.git\\**;..\\packages\\${name}\\node_modules\\**" />
</ItemGroup>
<!-- Do not delete the following Import Project.  While this appears to do nothing it is a marker for setting TypeScript properties before our import that depends on them. -->
<Import Project="$(MSBuildExtensionsPath32)\\Microsoft\\VisualStudio\\v$(VisualStudioVersion)\\TypeScript\\Microsoft.TypeScript.targets" Condition="False" />
<Import Project="$(VSToolsPath)\\Node.js Tools\\Microsoft.NodejsTools.targets" />
</Project>
`;

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
        const njsproj = genProj(project.name, project.guid);
        await njsprojBase.join(`${project.name}.njsproj`).writeFile(njsproj);
    }
}catch(e) {console.error(e)}
}

genAllSln(repositories);
