import React from 'react';

const AddLeadInstructions = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">How to Add a New Lead</h2>
      <div className="space-y-3">
        <p>Follow these steps to add a new lead to the system:</p>
        <ol className="list-decimal ml-6 space-y-2">
          <li>Fill out all required fields marked with an asterisk (*)</li>
          <li>Include as much contact information as possible</li>
          <li>Add any relevant notes about the lead's interests or needs</li>
          <li>Select the appropriate lead status</li>
          <li>Click the "Save" button to add the lead to the system</li>
        </ol>
        <p className="mt-4 text-sm text-gray-600">
          For additional assistance, refer to the documentation or contact support.
        </p>
      </div>
    </div>
  );
};

export default AddLeadInstructions;

export { AddLeadInstructions }