use anyhow::{Result, bail};
use std::path::Path;
use std::process::Command;

pub mod assertions;
mod cli;
mod contract;
pub mod coverage;
pub mod guard;
pub mod http;
mod lifecycles;
pub mod matrix;
mod mcporter;
pub mod process;
pub mod report;
pub mod reset;
mod services;
pub mod ssh;
pub mod suites;
pub mod surface;

const MATRIX_PATH: &str = "tests/live/service_matrix.json";
const REPORT_PATH: &str = "target/live-full/report.json";
pub(super) const LIVE_PORT: u16 = 40170;
const LIVE_SERVE_DEFAULT_PORT: u16 = 40171;
const LIVE_SERVE_MCP_PORT: u16 = 40172;
pub(super) const LIVE_AUTH_PORT: u16 = 40173;
pub(super) const LIVE_OAUTH_PORT: u16 = 40174;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Suite {
    Guard,
    Cli,
    Rest,
    Mcp,
    Mcporter,
    Services,
    Contract,
    Lifecycles,
    All,
    CoverageCheck,
    CoverageWrite,
}

pub fn run(args: &[String]) -> Result<()> {
    let options = Options::parse(args)?;
    if matches!(options.suite, Suite::CoverageCheck) {
        coverage::check_markdown(
            Path::new("docs/LIVE_ENDPOINT_COVERAGE.md"),
            Path::new(REPORT_PATH),
        )?;
        println!("docs/LIVE_ENDPOINT_COVERAGE.md is current for {REPORT_PATH}");
        return Ok(());
    }

    if matches!(options.suite, Suite::CoverageWrite) {
        coverage::write_markdown_from_file(
            Path::new("docs/LIVE_ENDPOINT_COVERAGE.md"),
            Path::new(REPORT_PATH),
        )?;
        println!("docs/LIVE_ENDPOINT_COVERAGE.md regenerated from {REPORT_PATH}");
        return Ok(());
    }

    let guarded = guard::load(None, options.allow_partial)?;
    let matrix = matrix::load(Path::new(MATRIX_PATH))?;
    let binary = yarr_binary()?;
    let yarr = process::YarrProcess::new(binary, &guarded);
    let mut report = report::Report::default();
    let surface_inventory = surface::inventory();
    let surface_markers = surface::runtime_markers();

    run_guard(&mut report, &guarded);
    match options.suite {
        Suite::Guard => {}
        Suite::Cli => cli::run(&mut report, &yarr, &matrix)?,
        Suite::Rest => suites::run_rest(&mut report, &yarr)?,
        Suite::Mcp => suites::run_mcp(&mut report, &yarr, &matrix)?,
        Suite::Mcporter => mcporter::run(
            &mut report,
            &yarr,
            &matrix,
            options.no_destructive,
            options.service.as_deref(),
        )?,
        Suite::Services => services::run(&mut report, &yarr, &matrix)?,
        Suite::Contract => contract::run(
            &mut report,
            &yarr,
            &matrix,
            options.no_destructive,
            options.service.as_deref(),
        )?,
        Suite::Lifecycles => lifecycles::run(&mut report, &yarr, options.no_destructive)?,
        Suite::CoverageCheck | Suite::CoverageWrite => {
            unreachable!("coverage check/write returns before live services load")
        }
        Suite::All => {
            cli::run(&mut report, &yarr, &matrix)?;
            suites::run_rest(&mut report, &yarr)?;
            suites::run_mcp(&mut report, &yarr, &matrix)?;
            mcporter::run(
                &mut report,
                &yarr,
                &matrix,
                options.no_destructive,
                options.service.as_deref(),
            )?;
            services::run(&mut report, &yarr, &matrix)?;
            contract::run(
                &mut report,
                &yarr,
                &matrix,
                options.no_destructive,
                options.service.as_deref(),
            )?;
            lifecycles::run(&mut report, &yarr, options.no_destructive)?;
        }
    }

    if matches!(options.suite, Suite::All) {
        ensure_surface_markers_recorded(&report, &surface_markers)?;
        ensure_surface_inventory_recorded(&report, &surface_inventory)?;
    }
    report.write_json(Path::new(REPORT_PATH))?;
    if matches!(options.suite, Suite::All) {
        coverage::write_markdown(
            Path::new("docs/LIVE_ENDPOINT_COVERAGE.md"),
            &report,
            REPORT_PATH,
        )?;
    }
    println!("{} live checks recorded in {REPORT_PATH}", report.len());
    if report.is_success() {
        Ok(())
    } else {
        bail!("one or more live checks failed")
    }
}

fn yarr_binary() -> Result<String> {
    if let Ok(binary) = std::env::var("YARR_BIN") {
        return Ok(binary);
    }

    let status = Command::new("cargo")
        .args(["build", "--bin", "yarr"])
        .env_remove("CARGO_PROFILE_DEV_CODEGEN_BACKEND")
        .status()?;
    if !status.success() {
        bail!("failed to build yarr debug binary for live suite");
    }
    Ok("target/debug/yarr".into())
}

fn run_guard(report: &mut report::Report, guarded: &guard::GuardedEnv) {
    let actual_kinds: std::collections::BTreeSet<_> =
        guarded.kinds.values().map(String::as_str).collect();
    let required_kinds = guard::required_kinds();
    report.pass(
        "guard complete shart env",
        format!(
            "{} services, {} required kinds",
            guarded.services.len(),
            actual_kinds.intersection(&required_kinds).count()
        ),
    );
}

pub(super) fn live_base_url() -> String {
    format!("http://127.0.0.1:{LIVE_PORT}")
}

fn ensure_surface_markers_recorded(
    report: &report::Report,
    expected_markers: &[&'static str],
) -> Result<()> {
    for marker in expected_markers {
        if !report.contains_check(marker) {
            bail!("live suite did not record required surface marker: {marker}");
        }
    }
    Ok(())
}

fn ensure_surface_inventory_recorded(
    report: &report::Report,
    inventory: &surface::SurfaceInventory,
) -> Result<()> {
    for check in &inventory.checks {
        if !report.contains_check(check.name) {
            bail!("live suite did not record inventory check: {}", check.name);
        }
    }
    Ok(())
}

#[derive(Debug)]
struct Options {
    suite: Suite,
    allow_partial: bool,
    no_destructive: bool,
    service: Option<String>,
}

impl Options {
    fn parse(args: &[String]) -> Result<Self> {
        let mut suite = Suite::All;
        let mut allow_partial = false;
        let mut no_destructive = false;
        let mut service = None;
        let mut index = 0;
        while index < args.len() {
            match args[index].as_str() {
                "--help" | "-h" => {
                    print_help();
                    std::process::exit(0);
                }
                "--allow-partial" => allow_partial = true,
                "--no-destructive" => no_destructive = true,
                "--service" => {
                    index += 1;
                    let value = args.get(index).map(String::as_str).unwrap_or("");
                    if value.is_empty() {
                        bail!("--service requires a service kind");
                    }
                    service = Some(value.to_ascii_lowercase());
                }
                "--suite" => {
                    index += 1;
                    let value = args.get(index).map(String::as_str).unwrap_or("");
                    suite = match value {
                        "guard" => Suite::Guard,
                        "cli" => Suite::Cli,
                        "rest" => Suite::Rest,
                        "mcp" => Suite::Mcp,
                        "mcporter" => Suite::Mcporter,
                        "services" => Suite::Services,
                        "contract" => Suite::Contract,
                        "lifecycles" => Suite::Lifecycles,
                        "all" => Suite::All,
                        "coverage-check" => Suite::CoverageCheck,
                        "coverage-write" => Suite::CoverageWrite,
                        _ => bail!("unknown live suite: {value}"),
                    };
                }
                "--coverage-check" => suite = Suite::CoverageCheck,
                "--coverage-write" => suite = Suite::CoverageWrite,
                other => bail!("unknown live option: {other}"),
            }
            index += 1;
        }
        Ok(Self {
            suite,
            allow_partial,
            no_destructive,
            service,
        })
    }
}

fn print_help() {
    println!(
        "cargo xtask live --suite <guard|cli|rest|mcp|mcporter|services|contract|lifecycles|all|coverage-check> [--no-destructive] [--service <kind>]"
    );
    println!("cargo xtask live --coverage-check");
    println!(
        "cargo xtask live --coverage-write   Regenerate the coverage doc from the existing report"
    );
    println!("  --allow-partial  Only permitted for legacy live-read-smoke guard checks");
    println!(
        "  --service <kind> Limit generated contract/mcporter suites to one spec-backed service"
    );
}
