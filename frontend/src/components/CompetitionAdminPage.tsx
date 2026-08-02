import React, { useEffect, useState } from "react";
import api from "../utils/api";

interface Team {
  id: number;
  name: string;
  stadium?: string;
  manager?: { full_name?: string };
}
interface Season {
  id: number;
  name: string;
  is_active: boolean;
  is_finalized?: boolean;
}
interface Competition {
  id: number;
  name: string;
  code: string;
  type: string;
  region: string;
  default_transfer_budget: number;
  default_salary_budget: number;
  seasons?: Season[];
}
interface Registration {
  season_id: number;
  team_id: number;
  team?: Team;
  transfer_budget: number;
  remaining_transfer_budget: number;
  salary_budget: number;
  remaining_salary_budget: number;
}

const emptyForm = {
  name: "",
  code: "",
  type: "domestic_league",
  region: "",
  organization_name: "",
  season_name: "2026/27",
  start_date: "2026-07-01",
  end_date: "2027-06-30",
  default_transfer_budget: "500000000",
  default_salary_budget: "200000000",
};

const CompetitionAdminPage: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [seasonTeams, setSeasonTeams] = useState<Record<number, Team[]>>({});
  const [registrations, setRegistrations] = useState<
    Record<number, Registration[]>
  >({});
  const [budgetDrafts, setBudgetDrafts] = useState<
    Record<string, { transfer: string; salary: string }>
  >({});
  const [editingBudgets, setEditingBudgets] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedTeams, setSelectedTeams] = useState<Record<number, string>>(
    {},
  );
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [rolloverSeason, setRolloverSeason] = useState<Season | null>(null);
  const [rolloverForm, setRolloverForm] = useState({
    name: "2027/28",
    start_date: "2027-07-01",
    end_date: "2028-06-30",
    promoted_team_ids: "",
    relegated_team_ids: "",
  });
  const [rollingOver, setRollingOver] = useState(false);

  const load = async () => {
    const [competitionResponse, teamResponse] = await Promise.all([
      api.get("/organizer/competitions"),
      api.get("/teams"),
    ]);
    const items: Competition[] = Array.isArray(competitionResponse.data)
      ? competitionResponse.data
      : [];
    setCompetitions(items);
    setAllTeams(Array.isArray(teamResponse.data) ? teamResponse.data : []);
    const seasons = items.flatMap((item) => item.seasons || []);
    const entries = await Promise.all(
      seasons.map(
        async (season) =>
          [
            season.id,
            (await api.get(`/organizer/seasons/${season.id}/registrations`))
              .data,
          ] as const,
      ),
    );
    const registrationMap = Object.fromEntries(
      entries.map(([id, items]) => [id, Array.isArray(items) ? items : []]),
    );
    setRegistrations(registrationMap);
    setSeasonTeams(
      Object.fromEntries(
        entries.map(([id, items]) => [
          id,
          (Array.isArray(items) ? items : [])
            .map((item: Registration) => item.team)
            .filter((team: Team | undefined): team is Team => Boolean(team)),
        ]),
      ),
    );
    const drafts: Record<string, { transfer: string; salary: string }> = {};
    Object.values(registrationMap)
      .flat()
      .forEach((item: any) => {
        drafts[`${item.season_id}-${item.team_id}`] = {
          transfer: String(item.transfer_budget),
          salary: String(item.salary_budget),
        };
      });
    setBudgetDrafts(drafts);
  };

  useEffect(() => {
    load().catch(() =>
      setMessage("Could not load competition administration."),
    );
  }, []);

  const createCompetition = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.post("/competitions", {
        ...form,
        default_transfer_budget: Number(form.default_transfer_budget),
        default_salary_budget: Number(form.default_salary_budget),
      });
      setForm(emptyForm);
      setMessage("Competition and first season created.");
      await load();
      window.dispatchEvent(new Event("auth-changed"));
    } catch (error: any) {
      setMessage(
        error.response?.data?.error || "Could not create competition.",
      );
    } finally {
      setSaving(false);
    }
  };

  const createTeamName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await api.post("/organizer/teams", { name: newTeamName.trim() });
      setNewTeamName("");
      setMessage(
        "Team name registered. It is now available to managers and competitions.",
      );
      await load();
    } catch (error: any) {
      setMessage(
        error.response?.data?.error || "Could not register team name.",
      );
    }
  };

  const addTeam = async (seasonID: number) => {
    const teamID = Number(selectedTeams[seasonID]);
    if (!teamID) return;
    try {
      await api.post(`/seasons/${seasonID}/teams`, { team_id: teamID });
      setMessage("Team added to the season.");
      await load();
      window.dispatchEvent(new Event("auth-changed"));
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Could not add team.");
    }
  };

  const removeTeam = async (seasonID: number, teamID: number) => {
    await api.delete(`/seasons/${seasonID}/teams/${teamID}`);
    setMessage("Team removed from the season.");
    await load();
    window.dispatchEvent(new Event("auth-changed"));
  };

  const saveBudget = async (seasonID: number, teamID: number) => {
    const draft = budgetDrafts[`${seasonID}-${teamID}`];
    if (!draft) return;
    try {
      await api.put(`/organizer/seasons/${seasonID}/teams/${teamID}/budget`, {
        transfer_budget: Number(draft.transfer),
        salary_budget: Number(draft.salary),
      });
      setMessage("Team budgets updated.");
      setEditingBudgets((current) => ({
        ...current,
        [`${seasonID}-${teamID}`]: false,
      }));
      await load();
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Could not update budgets.");
    }
  };
  const generateFixtures = async (seasonID: number) => {
    try {
      const response = await api.post(
        `/organizer/seasons/${seasonID}/generate-fixtures`,
      );
      setMessage(`${response.data.created} fixtures generated.`);
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Could not generate fixtures.");
    }
  };

  const submitRollover = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rolloverSeason) return;
    const ids = (value: string) =>
      value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter(Boolean);
    setRollingOver(true);
    try {
      await api.post(`/organizer/seasons/${rolloverSeason.id}/rollover`, {
        ...rolloverForm,
        promoted_team_ids: ids(rolloverForm.promoted_team_ids),
        relegated_team_ids: ids(rolloverForm.relegated_team_ids),
      });
      setMessage("Season finalized and the next season created.");
      setRolloverSeason(null);
      await load();
      window.dispatchEvent(new Event("auth-changed"));
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Could not roll over season.");
    } finally {
      setRollingOver(false);
    }
  };

  const deleteCompetition = async (competition: Competition) => {
    if (!window.confirm(`Delete ${competition.name}? This cannot be undone.`))
      return;
    try {
      await api.delete(`/competitions/${competition.id}`);
      setMessage("Competition deleted.");
      await load();
      window.dispatchEvent(new Event("auth-changed"));
    } catch (error: any) {
      setMessage(
        error.response?.data?.error || "Could not delete competition.",
      );
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-slate-950 p-7 text-white shadow-xl">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-emerald-300">
          Competition organizer
        </p>
        <h1 className="mt-2 text-3xl font-black">
          League & Tournament Control
        </h1>
        <p className="mt-2 text-slate-300">
          Create competitions, define the first season and manage registered
          teams.
        </p>
      </section>
      {message && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          {message}
        </div>
      )}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Register a team name</h2>
        <p className="mt-1 text-sm text-slate-500">
          Organizer accounts can only register the team name. Team profile
          details remain under the assigned manager.
        </p>
        <form
          onSubmit={createTeamName}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            required
            value={newTeamName}
            onChange={(event) => setNewTeamName(event.target.value)}
            className="auth-input flex-1"
            placeholder="New team name"
          />
          <button className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">
            Register team
          </button>
        </form>
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            All registered team names
          </p>
          <div className="flex flex-wrap gap-2">
            {allTeams.map((team) => (
              <span
                key={team.id}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${team.manager ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
              >
                {team.name} ·{" "}
                {team.manager?.full_name || "Available for a manager"}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Create a competition</h2>
        <form
          onSubmit={createCompetition}
          className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <label>
            <span className="auth-label">Competition name</span>
            <input
              required
              className="auth-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="English Premier League"
            />
          </label>
          <label>
            <span className="auth-label">Code</span>
            <input
              required
              className="auth-input"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              placeholder="EPL"
            />
          </label>
          <label>
            <span className="auth-label">Organization</span>
            <input
              className="auth-input"
              value={form.organization_name}
              onChange={(e) =>
                setForm({ ...form, organization_name: e.target.value })
              }
              placeholder="Premier League"
            />
          </label>
          <label>
            <span className="auth-label">Region</span>
            <input
              className="auth-input"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="England"
            />
          </label>
          <label>
            <span className="auth-label">Format</span>
            <select
              className="auth-input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="domestic_league">Domestic league</option>
              <option value="continental_club">Continental club</option>
              <option value="international">International</option>
              <option value="knockout">Knockout tournament</option>
            </select>
          </label>
          <label>
            <span className="auth-label">Season</span>
            <input
              required
              className="auth-input"
              value={form.season_name}
              onChange={(e) =>
                setForm({ ...form, season_name: e.target.value })
              }
            />
          </label>
          <label>
            <span className="auth-label">Start date</span>
            <input
              required
              type="date"
              className="auth-input"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </label>
          <label>
            <span className="auth-label">End date</span>
            <input
              required
              type="date"
              className="auth-input"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </label>
          <label>
            <span className="auth-label">Default transfer budget</span>
            <input
              required
              min="0"
              type="number"
              className="auth-input"
              value={form.default_transfer_budget}
              onChange={(e) =>
                setForm({ ...form, default_transfer_budget: e.target.value })
              }
            />
          </label>
          <label>
            <span className="auth-label">Default salary budget</span>
            <input
              required
              min="0"
              type="number"
              className="auth-input"
              value={form.default_salary_budget}
              onChange={(e) =>
                setForm({ ...form, default_salary_budget: e.target.value })
              }
            />
          </label>
          <button
            disabled={saving}
            className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-60 md:col-span-2 lg:col-span-4"
          >
            {saving ? "Creating..." : "Create competition"}
          </button>
        </form>
      </section>
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-black">My competitions</h2>
          <p className="text-sm text-slate-500">
            Only competitions created by this organizer can be modified here.
          </p>
        </div>
        {competitions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No competitions created yet.
          </div>
        ) : (
          competitions.map((competition) => (
            <article
              key={competition.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    {competition.code}
                  </span>
                  <h3 className="mt-2 text-xl font-black">
                    {competition.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {competition.type.replaceAll("_", " ")} ·{" "}
                    {competition.region || "Global"}
                  </p>
                </div>
                <button
                  onClick={() => deleteCompetition(competition)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  Delete competition
                </button>
              </div>
              {(competition.seasons || []).map((season) => {
                const registered = seasonTeams[season.id] || [];
                const seasonRegistrations = registrations[season.id] || [];
                const available = allTeams.filter(
                  (team) => !registered.some((item) => item.id === team.id),
                );
                return (
                  <div
                    key={season.id}
                    className="mt-5 rounded-xl bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">Season {season.name}</p>
                        <p className="text-xs text-slate-500">
                          {registered.length} registered teams
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => generateFixtures(season.id)}
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
                        >
                          Generate fixtures
                        </button>
                        {season.is_active && !season.is_finalized && (
                          <button
                            onClick={() => setRolloverSeason(season)}
                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700"
                          >
                            Close &amp; new season
                          </button>
                        )}
                        <select
                          value={selectedTeams[season.id] || ""}
                          onChange={(e) =>
                            setSelectedTeams({
                              ...selectedTeams,
                              [season.id]: e.target.value,
                            })
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Select a team</option>
                          {available.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => addTeam(season.id)}
                          className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white"
                        >
                          Add team
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {seasonRegistrations.map((registration) => {
                        const team = registration.team!;
                        const key = `${season.id}-${team.id}`;
                        const draft = budgetDrafts[key] || {
                          transfer: String(registration.transfer_budget),
                          salary: String(registration.salary_budget),
                        };
                        return (
                          <div
                            key={team.id}
                            className="rounded-lg border border-slate-200 bg-white p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-bold">{team.name}</p>
                                <p className="text-xs text-slate-500">
                                  {team.manager?.full_name || "No manager"}
                                </p>
                              </div>
                              <button
                                onClick={() => removeTeam(season.id, team.id)}
                                className="text-xs font-bold text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                            {editingBudgets[key] ? (
                              <>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <label className="text-xs text-slate-500">
                                    Transfer budget
                                    <input
                                      type="number"
                                      className="mt-1 w-full rounded border p-2 text-sm"
                                      value={draft.transfer}
                                      onChange={(e) =>
                                        setBudgetDrafts({
                                          ...budgetDrafts,
                                          [key]: {
                                            ...draft,
                                            transfer: e.target.value,
                                          },
                                        })
                                      }
                                    />
                                  </label>
                                  <label className="text-xs text-slate-500">
                                    Salary budget
                                    <input
                                      type="number"
                                      className="mt-1 w-full rounded border p-2 text-sm"
                                      value={draft.salary}
                                      onChange={(e) =>
                                        setBudgetDrafts({
                                          ...budgetDrafts,
                                          [key]: {
                                            ...draft,
                                            salary: e.target.value,
                                          },
                                        })
                                      }
                                    />
                                  </label>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                  <span>
                                    Remaining: ₹
                                    {registration.remaining_transfer_budget.toLocaleString()}{" "}
                                    / ₹
                                    {registration.remaining_salary_budget.toLocaleString()}
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setBudgetDrafts({
                                          ...budgetDrafts,
                                          [key]: {
                                            transfer: String(
                                              registration.transfer_budget,
                                            ),
                                            salary: String(
                                              registration.salary_budget,
                                            ),
                                          },
                                        });
                                        setEditingBudgets({
                                          ...editingBudgets,
                                          [key]: false,
                                        });
                                      }}
                                      className="font-bold text-slate-500"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() =>
                                        saveBudget(season.id, team.id)
                                      }
                                      disabled={
                                        Number(draft.transfer) ===
                                          registration.transfer_budget &&
                                        Number(draft.salary) ===
                                          registration.salary_budget
                                      }
                                      className="font-bold text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Save changes
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="mt-3">
                                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                                  <div>
                                    <p className="text-slate-500">
                                      Transfer budget
                                    </p>
                                    <p className="mt-1 font-bold text-slate-900">
                                      ₹
                                      {registration.transfer_budget.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">
                                      Salary budget
                                    </p>
                                    <p className="mt-1 font-bold text-slate-900">
                                      ₹
                                      {registration.salary_budget.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">
                                      Transfer remaining
                                    </p>
                                    <p className="mt-1 font-semibold text-emerald-700">
                                      ₹
                                      {registration.remaining_transfer_budget.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">
                                      Salary remaining
                                    </p>
                                    <p className="mt-1 font-semibold text-emerald-700">
                                      ₹
                                      {registration.remaining_salary_budget.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 flex justify-end">
                                  <button
                                    onClick={() =>
                                      setEditingBudgets({
                                        ...editingBudgets,
                                        [key]: true,
                                      })
                                    }
                                    className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
                                  >
                                    Edit budgets
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </article>
          ))
        )}
      </section>
      {rolloverSeason && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          onClick={() => !rollingOver && setRolloverSeason(null)}
        >
          <form
            onSubmit={submitRollover}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                  Season rollover
                </p>
                <h2 className="text-2xl font-black">
                  Close {rolloverSeason.name}
                </h2>
              </div>
              <button
                type="button"
                disabled={rollingOver}
                onClick={() => setRolloverSeason(null)}
                className="text-2xl text-slate-400"
              >
                ×
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Existing teams carry forward automatically. Enter team IDs only
              for promotion or relegation changes.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="auth-label">New season name</span>
                <input
                  required
                  className="auth-input"
                  value={rolloverForm.name}
                  onChange={(e) =>
                    setRolloverForm({ ...rolloverForm, name: e.target.value })
                  }
                />
              </label>
              <label>
                <span className="auth-label">Start date</span>
                <input
                  required
                  type="date"
                  className="auth-input"
                  value={rolloverForm.start_date}
                  onChange={(e) =>
                    setRolloverForm({
                      ...rolloverForm,
                      start_date: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span className="auth-label">End date</span>
                <input
                  required
                  type="date"
                  className="auth-input"
                  value={rolloverForm.end_date}
                  onChange={(e) =>
                    setRolloverForm({
                      ...rolloverForm,
                      end_date: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span className="auth-label">Promoted team IDs</span>
                <input
                  className="auth-input"
                  placeholder="12, 18"
                  value={rolloverForm.promoted_team_ids}
                  onChange={(e) =>
                    setRolloverForm({
                      ...rolloverForm,
                      promoted_team_ids: e.target.value,
                    })
                  }
                />
              </label>
              <label className="sm:col-span-2">
                <span className="auth-label">Relegated team IDs</span>
                <input
                  className="auth-input"
                  placeholder="3, 7"
                  value={rolloverForm.relegated_team_ids}
                  onChange={(e) =>
                    setRolloverForm({
                      ...rolloverForm,
                      relegated_team_ids: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            <button
              disabled={rollingOver}
              className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-60"
            >
              {rollingOver
                ? "Creating season..."
                : "Finalize and create season"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CompetitionAdminPage;
