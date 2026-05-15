export function getDefaultStarterCode(language) {
    if (language === "JAVA") {
        return 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello SkillSync");\n  }\n}';
    }

    if (language === "JAVASCRIPT") {
        return 'console.log("Hello SkillSync");';
    }

    if (language === "PYTHON") {
        return 'print("Hello SkillSync")';
    }

    return "";
}