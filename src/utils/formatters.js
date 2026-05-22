export function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString();
}

export function formatLanguage(language) {
    if (!language) {
        return "-";
    }

    if (language === "JAVASCRIPT") {
        return "JavaScript";
    }

    if (language === "PYTHON") {
        return "Python";
    }

    if (language === "JAVA") {
        return "Java";
    }

    if (language === "TEXT") {
        return "Text";
    }

    return language;
}

export function formatAssessmentType(type) {
    if (!type) {
        return "-";
    }

    if (type === "CODING_CHALLENGE") {
        return "Coding Challenge";
    }

    if (type === "MCQ" || type === "QUIZ") {
        return "MCQ / Short Answer";
    }

    return type;
}
