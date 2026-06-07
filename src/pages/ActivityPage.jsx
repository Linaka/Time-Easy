import React, { useState } from "react";
import {
  Plus,
  X
} from "lucide-react";
import {
  ActivityList,
  FilterSelect,
  GhostButton,
  Panel,
  PrimaryButton
} from "../components/ui.jsx";
import styles from "./ActivityPage.module.css";

export function ActivityPage({ activityItems, onAddActivityNote, onClearActivity }) {
  const [filter, setFilter] = useState("All");
  const [note, setNote] = useState("");
  const visibleItems = activityItems.filter((item) => filter === "All" || item.type === filter);
  const types = ["All", ...Array.from(new Set(activityItems.map((item) => item.type)))];

  return (
    <Panel
      title="Activity log"
      subtitle="Audit-style feed for changes across the workspace."
      action={
        <div className={styles["activity-page__style-001"]}>
          <FilterSelect label="Type" value={filter} onChange={setFilter} options={types} />
          <GhostButton onClick={onClearActivity} icon={X}>Clear</GhostButton>
        </div>
      }
    >
      <form
        className={styles["activity-page__style-002"]}
        onSubmit={(event) => {
          event.preventDefault();
          if (onAddActivityNote(note)) {
            setNote("");
          }
        }}
      >
        <label className={styles["activity-page__style-003"]} htmlFor="activity-note">Activity note</label>
        <input
          id="activity-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={styles["activity-page__style-004"]}
          placeholder="Add an internal activity note"
        />
        <PrimaryButton type="submit" icon={Plus}>Add note</PrimaryButton>
      </form>
      <ActivityList items={visibleItems} />
    </Panel>
  );
}
