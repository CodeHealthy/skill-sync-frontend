import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssignmentDetail from "./AssignmentDetail";

const assignment = {
    id: "assignment-1",
    assessmentTitle: "Backend Engineer Assessment",
    assessmentType: "CODING_CHALLENGE",
    status: "ASSIGNED",
    organizationName: "Acme Hiring",
    language: "JAVA",
    prompt: "Solve the coding task.",
    maxScore: 100,
    startedAt: "2026-05-25T09:00:00.000Z",
    dueAt: "2026-05-26T09:00:00.000Z",
    timeLimitMinutes: null,
    sectionAttempts: [],
    sections: [
        {
            id: "section-1",
            title: "Coding",
            description: "Implementation task",
            questions: [
                {
                    id: "coding-question",
                    type: "CODING_CHALLENGE",
                    title: "FizzBuzz",
                    prompt: "Print FizzBuzz.",
                    points: 100,
                },
            ],
        },
    ],
    testCases: [
        {
            name: "Visible sample",
            input: "3",
            expectedOutput: "Fizz",
            hidden: false,
            points: 20,
        },
        {
            name: "Hidden grading case",
            input: "15",
            expectedOutput: "FizzBuzz",
            hidden: true,
            points: 80,
        },
    ],
};

function renderAssignmentDetail(overrides = {}) {
    const handlers = {
        onCodeChange: jest.fn(),
        onAnswerChange: jest.fn(),
        onRunCode: jest.fn(),
        onStartAssignment: jest.fn(),
        onStartSection: jest.fn(),
        onCompleteSection: jest.fn(),
        onSubmit: jest.fn(),
        onBack: jest.fn(),
    };

    render(
        <AssignmentDetail
            assignment={{ ...assignment, ...overrides.assignment }}
            code={overrides.code ?? "public class Main {}"}
            answer={overrides.answer ?? {}}
            submittingAssignmentId={null}
            runningAssignmentId={null}
            startingAssignmentId={null}
            runResult={overrides.runResult ?? null}
            {...handlers}
        />
    );

    return handlers;
}

describe("AssignmentDetail", () => {
    test("starts the active section and hides hidden test case details from candidates", async () => {
        const handlers = renderAssignmentDetail();

        expect(screen.getByText("Visible sample")).toBeInTheDocument();
        expect(screen.getByText("Fizz")).toBeInTheDocument();
        expect(screen.queryByText("Hidden grading case")).not.toBeInTheDocument();
        expect(screen.queryByText("FizzBuzz")).not.toBeInTheDocument();

        await waitFor(() => {
            expect(handlers.onStartSection).toHaveBeenCalledWith(assignment, "section-1");
        });
    });

    test("submits only after candidate chooses the submit action", () => {
        const handlers = renderAssignmentDetail();

        expect(handlers.onSubmit).not.toHaveBeenCalled();

        userEvent.click(screen.getByRole("button", { name: /submit assessment/i }));

        expect(handlers.onSubmit).toHaveBeenCalledWith(assignment);
    });
});
