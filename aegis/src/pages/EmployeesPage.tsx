import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Search } from 'lucide-react';
import { getEmployees } from '../api/employee.api';
import { StatusBadge } from '../components/StatusBadge';
import { useEmployeeStore } from '../store/employeeStore';

export function EmployeesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });
  const setEmployees = useEmployeeStore((state) => state.setEmployees);

  useEffect(() => {
    if (data?.data?.employees) {
      setEmployees(data.data.employees);
    }
  }, [data, setEmployees]);

  const employees = data?.data?.employees ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">People operations</p>
          <h2 className="text-2xl font-semibold text-slate-900">Employees</h2>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          <input className="outline-none" placeholder="Search employees" />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? <tr><td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>Loading employees…</td></tr> : employees.map((employee: any) => (
              <tr key={employee._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Briefcase className="h-5 w-5" /></div>
                    <div>
                      <p className="font-medium text-slate-900">{employee.name}</p>
                      <p className="text-sm text-slate-500">{employee.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{employee.role}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{employee.department}</td>
                <td className="px-4 py-3"><StatusBadge status={employee.status ?? 'Pending'} /></td>
                <td className="px-4 py-3">
                  <Link to={`/employees/${employee._id}`} className="inline-flex items-center gap-2 text-sm font-medium text-brand-600">
                    View <ArrowRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
