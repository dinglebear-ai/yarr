//! Static checks for the conventions documented in `docs/PATTERNS.md`.

mod actions;
mod checks;
mod reporter;
mod surfaces;
mod util;

use anyhow::{Result, bail};

use reporter::PatternReporter;

#[derive(Debug, Clone, Copy, Default)]
pub struct PatternOptions {
    pub strict: bool,
    pub json: bool,
}

pub fn run(options: PatternOptions) -> Result<()> {
    let mut reporter = PatternReporter::default();

    checks::required_files(&mut reporter);
    checks::no_mod_rs(&mut reporter);
    checks::file_sizes(&mut reporter)?;
    checks::thin_shims(&mut reporter);
    surfaces::thin_surfaces(&mut reporter)?;
    actions::action_surfaces(&mut reporter);
    checks::routes(&mut reporter);
    checks::plugins(&mut reporter);
    checks::config_and_auth(&mut reporter);
    checks::naming_contract(&mut reporter);
    checks::tooling(&mut reporter);

    if options.json {
        reporter.print_json();
    } else {
        reporter.print();
    }
    if reporter.has_failures() || (options.strict && reporter.has_warnings()) {
        if options.strict && reporter.has_warnings() {
            bail!("PATTERNS.md contract check failed in strict mode");
        }
        bail!("PATTERNS.md contract check failed");
    }
    Ok(())
}
