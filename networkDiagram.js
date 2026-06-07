import { useState } from "react";

const phases = [
  {
    id: 1,
    label: "PHASE 1",
    title: "Fix Immediate Issues",
    subtitle: "No network downtime — AD/DNS changes only",
    color: "#00c853",
    urgency: "DO NOW",
    steps: [
      {
        number: "1.1",
        title: "Open AD Sites and Services",
        command: "dssite.msc",
        details: [
          "Run on any DC or machine with RSAT installed",
          "Expand the Sites folder in the left pane",
        ],
      },
      {
        number: "1.2",
        title: "Create Colorado Site",
        command: null,
        details: [
          "Right-click Sites → New Site",
          'Name it: HHI-Colorado',
          "Assign to DEFAULTIPSITELINK for now",
        ],
      },
      {
        number: "1.3",
        title: "Move HHI-COSVR05 to Colorado Site",
        command: null,
        details: [
          "Expand Sites → [Utah Site] → Servers",
          "Right-click HHI-COSVR05 → Move",
          "Select HHI-Colorado → OK",
        ],
      },
      {
        number: "1.4",
        title: "Add Subnet Mappings",
        command: null,
        details: [
          "Right-click Subnets → New Subnet",
          "10.11.153.0/24 → HHI-Utah (DCs)",
          "10.12.0.0/24 → HHI-Colorado",
          "VPN pool subnet → HHI-Utah",
        ],
      },
      {
        number: "1.5",
        title: "Force AD Replication",
        command: "repadmin /syncall /Ade",
        details: [
          "Run on a Utah DC",
          "Then verify: repadmin /replsummary",
          "Look for 0 failures across all DC pairs",
        ],
      },
      {
        number: "1.6",
        title: "Verify Client Site Assignment",
        command: "nltest /dsgetsite",
        details: [
          "Run on affected machines",
          "Also run: nltest /dsgetdc:yourdomain.com",
          "Should return a Utah DC, not HHI-COSVR05",
        ],
      },
      {
        number: "1.7",
        title: "Fix Broken Trust Machines",
        command: "Test-ComputerSecureChannel -Repair -Credential (Get-Credential)",
        details: [
          "Run as local admin on affected machine",
          "Enter domain admin credentials",
          "If returns True → reboot, done",
          "If returns False → remove/rejoin domain",
        ],
      },
    ],
  },
  {
    id: 2,
    label: "PHASE 2",
    title: "Building Segmentation",
    subtitle: "Planned change window — requires switches + Sophos",
    color: "#2979ff",
    urgency: "PLAN WITH BOSS",
    steps: [
      {
        number: "2.1",
        title: "Plan IP Scheme",
        command: null,
        details: [
          "Bldg 11 → 10.11.11.0/24  GW: 10.11.11.1",
          "Bldg 15 → 10.11.15.0/24  GW: 10.11.15.1",
          "Bldg 16 → 10.11.16.0/24  GW: 10.11.16.1",
          "Bldg 17 → 10.11.17.0/24  GW: 10.11.17.1",
          "Bldg 18 → 10.11.18.0/24  GW: 10.11.18.1",
          "Bldg 19 → 10.11.19.0/24  GW: 10.11.19.1",
          "Static pool: .2-.50 | DHCP pool: .51-.254",
        ],
      },
      {
        number: "2.2",
        title: "Configure VLANs on Dell Switches",
        command: null,
        details: [
          "Create VLAN IDs matching building numbers (11, 15, 16, 17, 18, 19)",
          "Tag trunk port to Sophos with all VLANs",
          "Set access ports per building as untagged",
          "Verify: show vlan / show interfaces trunk",
          "Note: CLI syntax differs per Dell model",
        ],
      },
      {
        number: "2.3",
        title: "Configure Sophos Subinterfaces",
        command: null,
        details: [
          "On primary HA node only (syncs to secondary)",
          "Create LAN.11 → 10.11.11.1/24",
          "Create LAN.15 → 10.11.15.1/24",
          "Create LAN.16 → 10.11.16.1/24",
          "Create LAN.17 → 10.11.17.1/24",
          "Create LAN.18 → 10.11.18.1/24",
          "Create LAN.19 → 10.11.19.1/24",
          "Use VIP as gateway, not physical node IP",
        ],
      },
      {
        number: "2.4",
        title: "Configure DHCP Relay on Sophos",
        command: null,
        details: [
          "Per subinterface, set relay → Windows DHCP server IP",
          "This forwards DHCP broadcasts across subnets",
          "Sophos tags requests with giaddr so DHCP picks right scope",
        ],
      },
      {
        number: "2.5",
        title: "Create DHCP Scopes on Windows Server",
        command: null,
        details: [
          "New scope per building in DHCP Manager",
          "Start: 10.11.XX.51  End: 10.11.XX.254",
          "Exclusions: 10.11.XX.1 - 10.11.XX.50",
          "003 Router: 10.11.XX.1 (building gateway)",
          "006 DNS: 10.11.153.25, 10.11.153.49",
          "015 Domain: hhi.local",
          "Lease: 8 hours",
        ],
      },
      {
        number: "2.6",
        title: "Update AD Sites and Services",
        command: "dssite.msc",
        details: [
          "Add all building subnets → HHI-Utah",
          "10.11.11.0/24, 10.11.15.0/24, 10.11.16.0/24",
          "10.11.17.0/24, 10.11.18.0/24, 10.11.19.0/24",
          "Devices now auto-map to Utah DCs by building",
        ],
      },
      {
        number: "2.7",
        title: "Write Sophos Firewall Rules",
        command: null,
        details: [
          "Workstations → Servers: allow RDP, SMB, specific ports",
          "OT/Printers → other VLANs: deny or restrict heavily",
          "WiFi → internet only (or limited internal)",
          "All VLANs → DCs: allow TCP 88, 135, 389, 445, 49152-65535",
          "Start permissive, then tighten after testing",
        ],
      },
      {
        number: "2.8",
        title: "Set Up GPO Printer Mapping",
        command: null,
        details: [
          "Create one GPO per building",
          "Add WMI filter per building subnet:",
          'Bldg 11: SELECT * FROM Win32_IP4RouteTable WHERE Destination = "10.11.11.0"',
          "Deploy building printers in each GPO",
          "Users auto-get correct printers on login",
        ],
      },
      {
        number: "2.9",
        title: "Validate Everything",
        command: null,
        details: [
          "ipconfig → confirm building-specific IP",
          "nltest /dsgetsite → confirm Utah site",
          "nltest /dsgetdc → confirm Utah DC",
          "Ping gateway, DCs, internet",
          "Test HA failover — ping during switchover",
          "Confirm printers deploy on login",
        ],
      },
    ],
  },
];

const flowSteps = [
  { label: "Dell Switch\nVLAN Config", icon: "🔀", color: "#f59e0b" },
  { label: "Sophos\nSubinterface", icon: "🔥", color: "#ef4444" },
  { label: "DHCP Relay\non Sophos", icon: "📡", color: "#8b5cf6" },
  { label: "Windows DHCP\nScope Created", icon: "🗄️", color: "#06b6d4" },
  { label: "Device Gets\nBuilding IP", icon: "💻", color: "#10b981" },
];

export default function HHINetworkDiagram() {
  const [activePhase, setActivePhase] = useState(1);
  const [expandedStep, setExpandedStep] = useState(null);

  const currentPhase = phases.find((p) => p.id === activePhase);

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      background: "#0a0e1a",
      minHeight: "100vh",
      color: "#e2e8f0",
      padding: "24px 16px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          display: "inline-block",
          background: "linear-gradient(135deg, #1e3a5f, #0f2137)",
          border: "1px solid #2979ff44",
          borderRadius: "4px",
          padding: "6px 16px",
          fontSize: "11px",
          letterSpacing: "4px",
          color: "#2979ff",
          marginBottom: "12px",
          textTransform: "uppercase",
        }}>
          HHI Corporation — IT Network
        </div>
        <h1 style={{
          fontSize: "clamp(20px, 4vw, 28px)",
          fontWeight: "900",
          color: "#fff",
          margin: "0 0 6px",
          letterSpacing: "-0.5px",
        }}>
          Network Implementation Plan
        </h1>
        <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
          DC Fix + Building Segmentation — Order of Operations
        </p>
      </div>

      {/* Phase Tabs */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "24px",
        maxWidth: "800px",
        margin: "0 auto 24px",
      }}>
        {phases.map((phase) => (
          <button
            key={phase.id}
            onClick={() => { setActivePhase(phase.id); setExpandedStep(null); }}
            style={{
              flex: 1,
              padding: "12px 8px",
              borderRadius: "6px",
              border: `2px solid ${activePhase === phase.id ? phase.color : "#1e293b"}`,
              background: activePhase === phase.id
                ? `${phase.color}18`
                : "#0f172a",
              color: activePhase === phase.id ? phase.color : "#475569",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: "700",
              letterSpacing: "1px",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: "10px", marginBottom: "4px", opacity: 0.7 }}>
              {phase.label}
            </div>
            <div style={{ fontSize: "13px" }}>{phase.title}</div>
            <div style={{
              marginTop: "6px",
              padding: "2px 8px",
              borderRadius: "3px",
              background: activePhase === phase.id ? phase.color : "#1e293b",
              color: activePhase === phase.id ? "#000" : "#475569",
              fontSize: "9px",
              letterSpacing: "2px",
              display: "inline-block",
            }}>
              {phase.urgency}
            </div>
          </button>
        ))}
      </div>

      {/* Phase Content */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{
          background: "#0f172a",
          border: `1px solid ${currentPhase.color}33`,
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: currentPhase.color,
              boxShadow: `0 0 8px ${currentPhase.color}`,
            }} />
            <span style={{ color: currentPhase.color, fontSize: "11px", letterSpacing: "3px", fontWeight: "700" }}>
              {currentPhase.label}
            </span>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#fff", marginBottom: "4px" }}>
            {currentPhase.title}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>{currentPhase.subtitle}</div>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {currentPhase.steps.map((step, idx) => {
            const isExpanded = expandedStep === step.number;
            return (
              <div
                key={step.number}
                style={{
                  background: isExpanded ? "#131f35" : "#0f172a",
                  border: `1px solid ${isExpanded ? currentPhase.color + "55" : "#1e293b"}`,
                  borderRadius: "6px",
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
              >
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#e2e8f0",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  {/* Step number badge */}
                  <div style={{
                    minWidth: "36px",
                    height: "36px",
                    borderRadius: "4px",
                    background: isExpanded ? currentPhase.color : "#1e293b",
                    color: isExpanded ? "#000" : currentPhase.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "900",
                    letterSpacing: "0.5px",
                    transition: "all 0.2s",
                  }}>
                    {step.number}
                  </div>

                  {/* Title + command */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: isExpanded ? "#fff" : "#cbd5e1" }}>
                      {step.title}
                    </div>
                    {step.command && (
                      <div style={{
                        fontSize: "11px",
                        color: "#00c853",
                        marginTop: "2px",
                        fontFamily: "monospace",
                        opacity: 0.8,
                      }}>
                        $ {step.command.length > 50 ? step.command.substring(0, 50) + "..." : step.command}
                      </div>
                    )}
                  </div>

                  {/* Expand indicator */}
                  <div style={{
                    color: currentPhase.color,
                    fontSize: "18px",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0)",
                    transition: "transform 0.2s",
                    opacity: 0.7,
                  }}>›</div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{
                    padding: "0 16px 16px 66px",
                    borderTop: `1px solid ${currentPhase.color}22`,
                  }}>
                    {step.command && (
                      <div style={{
                        background: "#020817",
                        border: "1px solid #1e293b",
                        borderRadius: "4px",
                        padding: "10px 14px",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: "#00c853",
                        marginBottom: "12px",
                        marginTop: "12px",
                        wordBreak: "break-all",
                      }}>
                        $ {step.command}
                      </div>
                    )}
                    <ul style={{ margin: step.command ? 0 : "12px 0 0", padding: "0 0 0 16px" }}>
                      {step.details.map((detail, i) => (
                        <li key={i} style={{
                          fontSize: "13px",
                          color: "#94a3b8",
                          marginBottom: "6px",
                          lineHeight: "1.5",
                        }}>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Phase 2 Flow Diagram */}
        {activePhase === 2 && (
          <div style={{ marginTop: "32px" }}>
            <div style={{
              fontSize: "10px",
              letterSpacing: "3px",
              color: "#475569",
              textAlign: "center",
              marginBottom: "16px",
            }}>
              WHY THE ORDER MATTERS — EACH STEP ENABLES THE NEXT
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              overflowX: "auto",
              padding: "16px",
              background: "#0f172a",
              borderRadius: "8px",
              border: "1px solid #1e293b",
            }}>
              {flowSteps.map((step, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1, minWidth: "80px" }}>
                  <div style={{
                    flex: 1,
                    background: `${step.color}15`,
                    border: `1px solid ${step.color}44`,
                    borderRadius: "6px",
                    padding: "10px 6px",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: "20px", marginBottom: "6px" }}>{step.icon}</div>
                    <div style={{
                      fontSize: "10px",
                      color: step.color,
                      fontWeight: "700",
                      lineHeight: "1.4",
                      whiteSpace: "pre-line",
                    }}>
                      {step.label}
                    </div>
                  </div>
                  {idx < flowSteps.length - 1 && (
                    <div style={{ color: "#334155", fontSize: "18px", flexShrink: 0 }}>→</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{
              marginTop: "10px",
              padding: "10px 14px",
              background: "#1a0a0a",
              border: "1px solid #ef444433",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#f87171",
            }}>
              ⚠️ Skip any step and devices won't get building IPs — all four infrastructure pieces must exist before DHCP scopes matter.
            </div>
          </div>
        )}

        {/* Subnet Reference */}
        {activePhase === 2 && (
          <div style={{ marginTop: "20px" }}>
            <div style={{
              fontSize: "10px",
              letterSpacing: "3px",
              color: "#475569",
              marginBottom: "12px",
            }}>
              BUILDING SUBNET REFERENCE
            </div>
            <div style={{
              background: "#020817",
              border: "1px solid #1e293b",
              borderRadius: "6px",
              overflow: "hidden",
              fontSize: "12px",
              fontFamily: "monospace",
            }}>
              {[
                ["Bldg 11", "10.11.11.0/24", "10.11.11.1", "VLAN 11"],
                ["Bldg 15", "10.11.15.0/24", "10.11.15.1", "VLAN 15"],
                ["Bldg 16", "10.11.16.0/24", "10.11.16.1", "VLAN 16"],
                ["Bldg 17", "10.11.17.0/24", "10.11.17.1", "VLAN 17"],
                ["Bldg 18", "10.11.18.0/24", "10.11.18.1", "VLAN 18"],
                ["Bldg 19", "10.11.19.0/24", "10.11.19.1", "VLAN 19"],
                ["Servers", "10.11.153.0/24", "10.11.153.1", "—"],
                ["Colorado", "10.12.0.0/24", "10.12.0.1", "—"],
              ].map(([bldg, subnet, gw, vlan], i) => (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 1fr 70px",
                  padding: "8px 14px",
                  borderBottom: i < 7 ? "1px solid #0f172a" : "none",
                  background: i % 2 === 0 ? "transparent" : "#080d1a",
                  gap: "8px",
                }}>
                  <span style={{ color: "#2979ff", fontWeight: "700" }}>{bldg}</span>
                  <span style={{ color: "#00c853" }}>{subnet}</span>
                  <span style={{ color: "#94a3b8" }}>GW: {gw}</span>
                  <span style={{ color: "#f59e0b" }}>{vlan}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: "24px",
          padding: "12px",
          textAlign: "center",
          fontSize: "10px",
          color: "#334155",
          letterSpacing: "2px",
        }}>
          HHI CORPORATION — CONFIDENTIAL — IT DEPARTMENT
        </div>
      </div>
    </div>
  );
}
