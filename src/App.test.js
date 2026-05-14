import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders SkillSync home page", () => {
  render(<App />);

  expect(
    screen.getByText(/Automated Talent Skill-Validator/i)
  ).toBeInTheDocument();
});