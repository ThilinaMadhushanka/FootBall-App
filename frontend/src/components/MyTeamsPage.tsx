import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useCompetition } from "../context/CompetitionContext";
import ContractCounterModal from "./ContractCounterModal";

interface TeamPlayer {
  id: number;
  player_id: number;
  full_name: string;
  position: string;
  rating: number;
  position_in_team: string;
}

interface Team {
  id: number;
  manager_id: number;
  name: string;
  founded_year: number;
  stadium: string;
  location: string;
  logo_url: string;
  budget: number;
  created_at: string;
  players: TeamPlayer[];
  total_rating: number;
  formation: string;
}

interface TransferRequest {
  id: number;
  player?: { full_name?: string; position?: string };
  from_team?: { name?: string };
  to_team?: { name?: string };
}
interface ContractOffer {
  id: number;
  status: string;
  transfer_fee: number;
  salary_per_season: number;
  signing_bonus: number;
  contract_months: number;
  expires_at: string;
  message?: string;
  player?: { full_name?: string; position?: string };
  season?: { name?: string; competition?: { name?: string } };
}

const MyTeamsPage: React.FC = () => {
  const { selectedSeasonID, selectedCompetition, selectedSeason } =
    useCompetition();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>(
    [],
  );
  const [formationMessage, setFormationMessage] = useState<
    Record<number, string>
  >({});
  const [contractOffers, setContractOffers] = useState<ContractOffer[]>([]);
  const [budgetInfo, setBudgetInfo] = useState<any>(null);
  const [contractMessage, setContractMessage] = useState("");
  const [counterOffer, setCounterOffer] = useState<ContractOffer | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if user is logged in
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your teams");
          return;
        }

        const response = await api.get("/teams/my-teams");
        const teamsData = response.data as Team[];

        if (!teamsData || !Array.isArray(teamsData)) {
          throw new Error("Invalid teams data received");
        }

        // Fetch players for each team
        const teamsWithPlayers = await Promise.all(
          teamsData.map(async (team) => {
            if (!team || !team.id) {
              console.warn("Invalid team data:", team);
              return null;
            }
            try {
              const playersResponse = await api.get(
                `/teams/${team.id}/players`,
              );
              const players = playersResponse.data as TeamPlayer[];

              return {
                ...team,
                players: players || [],
                total_rating: team.total_rating || 0,
                formation: team.formation || "4-4-2",
              } as Team;
            } catch (err) {
              console.error(`Error fetching players for team ${team.id}:`, err);
              return {
                ...team,
                players: [],
                total_rating: team.total_rating || 0,
                formation: team.formation || "4-4-2",
              } as Team;
            }
          }),
        );

        // Filter out any null teams and ensure type safety
        const validTeams = teamsWithPlayers.filter(
          (team): team is Team => team !== null,
        );
        setTeams(validTeams);
      } catch (err: any) {
        const responseData = err.response?.data;
        const errorMessage =
          typeof responseData === "string"
            ? responseData
            : responseData?.error || "Failed to load teams";
        setError(errorMessage);
        console.error("Error in fetchTeams:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
    api
      .get("/team-requests/manager")
      .then((response) =>
        setTransferRequests(Array.isArray(response.data) ? response.data : []),
      )
      .catch(() => setTransferRequests([]));
    api
      .get("/contract-offers")
      .then((response) =>
        setContractOffers(Array.isArray(response.data) ? response.data : []),
      )
      .catch(() => setContractOffers([]));
    if (selectedSeasonID)
      api
        .get(`/seasons/${selectedSeasonID}/my-budget`)
        .then((response) => setBudgetInfo(response.data))
        .catch(() => setBudgetInfo(null));
  }, [selectedSeasonID]);

  const respondToTransfer = async (
    requestID: number,
    decision: "accepted" | "rejected",
  ) => {
    await api.put(`/team-requests/${requestID}/respond`, { decision });
    setTransferRequests((requests) =>
      requests.filter((request) => request.id !== requestID),
    );
    window.location.reload();
  };

  const respondToContract = async (
    offer: ContractOffer,
    action: "accept" | "reject" | "cancel",
  ) => {
    try {
      await api.put(`/contract-offers/${offer.id}/respond`, { action });
      setContractMessage(`Offer ${action} completed.`);
      const response = await api.get("/contract-offers");
      setContractOffers(response.data);
      if (selectedSeasonID) {
        const budget = await api.get(`/seasons/${selectedSeasonID}/my-budget`);
        setBudgetInfo(budget.data);
      }
    } catch (error: any) {
      setContractMessage(
        error.response?.data?.error || "Could not update offer.",
      );
    }
  };
  const submitManagerCounter = async (payload: Record<string, unknown>) => {
    if (!counterOffer) return;
    await api.put(`/contract-offers/${counterOffer.id}/respond`, payload);
    setContractMessage("Revised offer sent to player.");
    const response = await api.get("/contract-offers");
    setContractOffers(response.data);
  };

  const getFormationLayout = (formation: string) => {
    if (formation === "4-2-3-1")
      return { defenders: 4, midfielders: 5, forwards: 1 };
    const [defenders, midfielders, forwards] = formation.split("-").map(Number);
    return { defenders, midfielders, forwards };
  };

  const updateFormation = async (teamID: number, formation: string) => {
    setFormationMessage((current) => ({ ...current, [teamID]: "Saving…" }));
    try {
      await api.put(`/teams/${teamID}/formation`, { formation });
      setTeams((current) =>
        current.map((team) =>
          team.id === teamID ? { ...team, formation } : team,
        ),
      );
      setFormationMessage((current) => ({ ...current, [teamID]: "Saved" }));
    } catch (err: any) {
      const message =
        err.response?.status === 404
          ? "Backend restart required"
          : err.response?.data?.error || "Could not update formation";
      setFormationMessage((current) => ({ ...current, [teamID]: message }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Teams</h1>

      {budgetInfo && (
        <section className="mb-7 rounded-2xl bg-slate-950 p-5 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              {selectedCompetition?.name} · {selectedSeason?.name}
            </p>
            <h2 className="mt-1 text-xl font-black">Recruitment budgets</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs text-slate-400">Transfer remaining</p>
              <p className="text-lg font-black">
                ₹
                {Number(
                  budgetInfo.registration.remaining_transfer_budget,
                ).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs text-slate-400">Transfer reserved</p>
              <p className="text-lg font-black">
                ₹{Number(budgetInfo.reserved_transfer_budget).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs text-slate-400">Salary remaining</p>
              <p className="text-lg font-black">
                ₹
                {Number(
                  budgetInfo.registration.remaining_salary_budget,
                ).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs text-slate-400">Salary reserved</p>
              <p className="text-lg font-black">
                ₹{Number(budgetInfo.reserved_salary_budget).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      )}

      {contractOffers.some((offer) =>
        ["pending_manager", "pending_player"].includes(offer.status),
      ) && (
        <section className="mb-7 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <h2 className="text-lg font-black">Contract negotiations</h2>
          <p className="text-sm text-slate-600">
            Review player counter offers or cancel offers still awaiting a
            player.
          </p>
          {contractMessage && (
            <p className="mt-2 text-sm font-semibold text-indigo-700">
              {contractMessage}
            </p>
          )}
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {contractOffers
              .filter((offer) =>
                ["pending_manager", "pending_player"].includes(offer.status),
              )
              .map((offer) => (
                <div key={offer.id} className="rounded-xl bg-white p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-black">
                        {offer.player?.full_name || "Player"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {offer.status === "pending_manager"
                          ? "Player sent a counter offer"
                          : "Waiting for player"}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {offer.contract_months} months
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <p>
                      Fee
                      <br />
                      <strong>₹{offer.transfer_fee.toLocaleString()}</strong>
                    </p>
                    <p>
                      Salary
                      <br />
                      <strong>
                        ₹{offer.salary_per_season.toLocaleString()}
                      </strong>
                    </p>
                    <p>
                      Bonus
                      <br />
                      <strong>₹{offer.signing_bonus.toLocaleString()}</strong>
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {offer.status === "pending_manager" ? (
                      <>
                        <button
                          onClick={() => respondToContract(offer, "accept")}
                          className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setCounterOffer(offer)}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white"
                        >
                          Revise
                        </button>
                        <button
                          onClick={() => respondToContract(offer, "reject")}
                          className="rounded-lg border px-3 py-2 text-xs font-bold text-red-600"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => respondToContract(offer, "cancel")}
                        className="rounded-lg border px-3 py-2 text-xs font-bold text-red-600"
                      >
                        Cancel offer
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {transferRequests.length > 0 && (
        <section className="mb-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-black text-slate-900">
            Incoming transfer requests
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Other managers want to sign players from your squad.
          </p>
          <div className="mt-4 space-y-3">
            {transferRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold">
                    {request.player?.full_name || "Player"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {request.from_team?.name} → {request.to_team?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondToTransfer(request.id, "rejected")}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => respondToTransfer(request.id, "accepted")}
                    className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950"
                  >
                    Approve transfer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {teams.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          You haven't created any teams yet.
        </div>
      ) : (
        <div className="space-y-8">
          {teams.map((team) => {
            const { defenders, midfielders, forwards } = getFormationLayout(
              team.formation,
            );

            return (
              <div key={team.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    {team.logo_url && (
                      <img
                        src={team.logo_url}
                        alt={`${team.name} logo`}
                        className="w-16 h-16 object-contain"
                      />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {team.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Founded: {team.founded_year} | Stadium: {team.stadium}
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Formation</span>
                    <select
                      value={team.formation}
                      onChange={(event) =>
                        updateFormation(team.id, event.target.value)
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold text-slate-800"
                    >
                      <option value="4-4-2">4-4-2</option>
                      <option value="4-3-3">4-3-3</option>
                      <option value="3-5-2">3-5-2</option>
                      <option value="5-3-2">5-3-2</option>
                      <option value="4-2-3-1">4-2-3-1</option>
                    </select>
                    {formationMessage[team.id] && (
                      <span
                        className={`text-xs font-bold ${formationMessage[team.id] === "Saved" ? "text-emerald-600" : formationMessage[team.id] === "Saving…" ? "text-slate-400" : "text-red-600"}`}
                      >
                        {formationMessage[team.id]}
                      </span>
                    )}
                  </label>
                </div>

                <div className="relative h-96 bg-green-800 rounded-lg overflow-hidden">
                  {/* Field lines */}
                  <div className="absolute inset-0 border-2 border-white opacity-30"></div>
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    {/* Forwards */}
                    <div className="flex justify-around">
                      {Array.from({ length: forwards }).map((_, index) => {
                        const player = team.players.find(
                          (p) => p.position_in_team === `F${index + 1}`,
                        );
                        return (
                          <div
                            key={`F${index}`}
                            className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xs text-center"
                          >
                            {player ? (
                              <>
                                <div className="font-bold">
                                  {player.full_name}
                                </div>
                                <div className="text-gray-500">
                                  {player.rating}
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-400">Empty</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Midfielders */}
                    <div className="flex justify-around">
                      {Array.from({ length: midfielders }).map((_, index) => {
                        const player = team.players.find(
                          (p) => p.position_in_team === `M${index + 1}`,
                        );
                        return (
                          <div
                            key={`M${index}`}
                            className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xs text-center"
                          >
                            {player ? (
                              <>
                                <div className="font-bold">
                                  {player.full_name}
                                </div>
                                <div className="text-gray-500">
                                  {player.rating}
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-400">Empty</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Defenders */}
                    <div className="flex justify-around">
                      {Array.from({ length: defenders }).map((_, index) => {
                        const player = team.players.find(
                          (p) => p.position_in_team === `D${index + 1}`,
                        );
                        return (
                          <div
                            key={`D${index}`}
                            className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xs text-center"
                          >
                            {player ? (
                              <>
                                <div className="font-bold">
                                  {player.full_name}
                                </div>
                                <div className="text-gray-500">
                                  {player.rating}
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-400">Empty</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Goalkeeper */}
                    <div className="flex justify-center">
                      {(() => {
                        const goalkeeper = team.players.find(
                          (p) => p.position_in_team === "GK",
                        );
                        return (
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xs text-center">
                            {goalkeeper ? (
                              <>
                                <div className="font-bold">
                                  {goalkeeper.full_name}
                                </div>
                                <div className="text-gray-500">
                                  {goalkeeper.rating}
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-400">Empty</div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-5 rounded-xl bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-black text-slate-900">
                        Current squad
                      </h3>
                      <span className="text-sm text-slate-500">
                        {team.players.length} players
                      </span>
                    </div>
                    {team.players.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No players have joined this team yet. Invite players
                        from the Players page.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {team.players.map((player) => (
                          <div
                            key={player.id}
                            className="rounded-lg border border-slate-200 bg-white p-3"
                          >
                            <p className="font-bold text-slate-800">
                              {player.full_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {player.position} · Rating {player.rating}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Squad Players: {team.players.length}/25 · Starting XI: 11
                    </div>
                    <div className="text-sm font-medium">
                      Team Rating: {team.total_rating}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Budget: ${team.budget.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {counterOffer && (
        <ContractCounterModal
          offer={counterOffer}
          actor="manager"
          onClose={() => setCounterOffer(null)}
          onSubmit={submitManagerCounter}
        />
      )}
    </div>
  );
};

export default MyTeamsPage;
