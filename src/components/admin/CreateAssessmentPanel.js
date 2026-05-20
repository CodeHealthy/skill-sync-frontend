import AssessmentAssignForm from "./AssessmentAssignForm";
import AssessmentCreateForm from "./AssessmentCreateForm";
import AssessmentDetailsTable from "./AssessmentDetailsTable";
import "../../css/DashboardPanels.css";

function CreateAssessmentPanel({
    assessmentForm,
    creatingAssessment,
    wizardOpen,
    wizardStep,
    assignForm,
    assigningAssessment,
    candidates,
    assessments,
    tableAssessments,
    filteredAssessments,
    assessmentPage,
    pageSize,
    assessmentSearch,
    assessmentTypeFilter,
    assessmentLanguageFilter,
    onAssessmentSearchChange,
    onAssessmentTypeFilterChange,
    onAssessmentLanguageFilterChange,
    onAssessmentPageChange,
    onWizardOpenChange,
    onWizardStepChange,
    onGenerateWithAi,
    onAssessmentChange,
    onAssessmentTestCaseChange,
    onAddAssessmentTestCase,
    onRemoveAssessmentTestCase,
    onCreateAssessment,
    onAssignChange,
    onAssignAssessment,
}) {
    return (
        <div className="dashboard-panel-stack">
            <div className="dashboard-panel-grid dashboard-panel-grid-equal">
                <AssessmentCreateForm
                    assessmentForm={assessmentForm}
                    creatingAssessment={creatingAssessment}
                    wizardOpen={wizardOpen}
                    wizardStep={wizardStep}
                    onWizardOpenChange={onWizardOpenChange}
                    onWizardStepChange={onWizardStepChange}
                    onGenerateWithAi={onGenerateWithAi}
                    onAssessmentChange={onAssessmentChange}
                    onAssessmentTestCaseChange={onAssessmentTestCaseChange}
                    onAddAssessmentTestCase={onAddAssessmentTestCase}
                    onRemoveAssessmentTestCase={onRemoveAssessmentTestCase}
                    onCreateAssessment={onCreateAssessment}
                />

                <AssessmentAssignForm
                    candidates={candidates}
                    assessments={assessments}
                    assignForm={assignForm}
                    assigningAssessment={assigningAssessment}
                    onAssignChange={onAssignChange}
                    onAssignAssessment={onAssignAssessment}
                />
            </div>

            <AssessmentDetailsTable
                assessments={tableAssessments || assessments}
                totalItems={filteredAssessments?.length || assessments.length}
                page={assessmentPage}
                pageSize={pageSize}
                assessmentSearch={assessmentSearch}
                assessmentTypeFilter={assessmentTypeFilter}
                assessmentLanguageFilter={assessmentLanguageFilter}
                onAssessmentSearchChange={onAssessmentSearchChange}
                onAssessmentTypeFilterChange={onAssessmentTypeFilterChange}
                onAssessmentLanguageFilterChange={onAssessmentLanguageFilterChange}
                onPageChange={onAssessmentPageChange}
            />
        </div>
    );
}

export default CreateAssessmentPanel;
