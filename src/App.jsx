
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://dummyjson.com/users";

const emptyForm = {
  name: "",
  email: "",
  department: "IT",
  salary: "",
};

// Child component: Add and edit employee form
function EmployeeForm({
  formData,
  setFormData,
  editingId,
  onSubmit,
  onCancel,
  saving,
}) {
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section className="card">
      <h2>{editingId ? "Update Employee" : "Add Employee"}</h2>

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="name">Employee Name</label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter employee name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="department">Department</label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
          >
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
            <option value="Design">Design</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="salary">Monthly Salary (₹)</label>
          <input
            id="salary"
            name="salary"
            type="number"
            min="1"
            value={formData.salary}
            onChange={handleChange}
            placeholder="Enter salary"
            required
          />
        </div>

        <div className="button-group">
          <button type="submit" disabled={saving}>
            {saving
              ? "Please wait..."
              : editingId
              ? "Update Employee"
              : "Add Employee"}
          </button>

          {editingId && (
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

// Child component: Display employees
function EmployeeList({ employees, onEdit, onDelete, deletingId }) {
  return (
    <section className="card">
      <div className="section-header">
        <h2>Employee List</h2>
        <span className="count">
          Total: {employees.length}
        </span>
      </div>

      {employees.length === 0 ? (
        <p className="empty">No employees found.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Salary (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{employee.department}</td>
                  <td>
                    {Number(employee.salary).toLocaleString("en-IN")}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => onEdit(employee)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        disabled={deletingId === employee.id}
                        onClick={() => onDelete(employee.id)}
                      >
                        {deletingId === employee.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function App() {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // READ: Fetch employees from API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}?limit=10`);

        if (!response.ok) {
          throw new Error("Unable to fetch employees.");
        }

        const data = await response.json();

        const formattedEmployees = data.users.map((user) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          department: user.company?.department || "IT",
          salary: user.company?.title ? 45000 : 35000,
        }));

        setEmployees(formattedEmployees);
      } catch (err) {
        setError(
          "Could not load employees. Check your internet connection and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // CREATE and UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const name = formData.name.trim();
    const email = formData.email.trim();
    const salary = Number(formData.salary);

    if (
      !name ||
      !email ||
      !Number.isFinite(salary) ||
      salary <= 0
    ) {
      setError("Please enter valid employee details.");
      return;
    }

    const nameParts = name.split(/\s+/);

    const employeeData = {
      name,
      email,
      department: formData.department,
      salary,
    };

    const apiData = {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(" ") || "-",
      email,
      company: {
        department: formData.department,
      },
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        // UPDATE: Send PUT request
        const response = await fetch(`${API_URL}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          throw new Error("Unable to update employee.");
        }

        await response.json();

        setEmployees((previous) =>
          previous.map((employee) =>
            employee.id === editingId
              ? { ...employee, ...employeeData }
              : employee
          )
        );

        setMessage("Employee updated successfully!");
      } else {
        // CREATE: Send POST request
        const response = await fetch(`${API_URL}/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          throw new Error("Unable to add employee.");
        }

        const created = await response.json();

        setEmployees((previous) => [
          ...previous,
          { id: created.id, ...employeeData },
        ]);

        setMessage("Employee added successfully!");
      }

      setFormData(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Load employee details into the form
  const handleEdit = (employee) => {
    setEditingId(employee.id);
    setFormData({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      salary: String(employee.salary),
    });
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // DELETE: Send DELETE request
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      setDeletingId(id);

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete employee.");
      }

      await response.json();

      setEmployees((previous) =>
        previous.filter((employee) => employee.id !== id)
      );

      if (editingId === id) {
        setEditingId(null);
        setFormData(emptyForm);
      }

      setMessage("Employee deleted successfully!");
    } catch (err) {
      setError(err.message || "Unable to delete employee.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setMessage("");
    setError("");
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Employee Management System</h1>
        <p>Complete CRUD Application using React and API</p>
      </header>

      <main className="container">
        {message && (
          <p className="message success" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="message error" role="alert">
            {error}
          </p>
        )}

        <EmployeeForm
          formData={formData}
          setFormData={setFormData}
          editingId={editingId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          saving={saving}
        />

        <section className="card">
          {loading ? (
            <p className="info">Loading employees from API...</p>
          ) : error && employees.length === 0 ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Retry Loading
            </button>
          ) : (
            <EmployeeList
              employees={employees}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          )}
        </section>
      </main>

      <footer className="footer">
        React JS CRUD Practical
      </footer>
    </div>
  );
}

export default App;
