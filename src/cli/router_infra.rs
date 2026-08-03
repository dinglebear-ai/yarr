use anyhow::{Result, anyhow};

use super::super::command::Command;
use super::super::parse::{parse_bool_flag, parse_watch_flags, reject_args};
use super::super::setup::SetupCommand;

pub(super) fn parse_infra_command(verb: &str, rest: &[String]) -> Result<Command> {
    match verb {
        "help" => {
            reject_args(rest, "help")?;
            Ok(Command::Help)
        }
        "codemode" => parse_codemode_command(rest),
        "snippet" => parse_snippet_command(rest),
        "discover" => parse_discover_command(rest),
        "doctor" => Ok(Command::Doctor {
            json: parse_bool_flag(rest, "doctor", "--json")?,
        }),
        "watch" => {
            let (url, interval_arg, once) = parse_watch_flags(rest)?;
            let interval = interval_arg.map_or(Ok(10), |v| {
                v.parse().map_err(|_| {
                    anyhow!("watch --interval must be a positive integer number of seconds")
                })
            })?;
            if interval == 0 {
                return Err(anyhow!(
                    "watch --interval must be a positive integer number of seconds"
                ));
            }
            Ok(Command::Watch {
                url,
                interval,
                once,
            })
        }
        "setup" => parse_setup_command(rest),
        "serve" | "mcp" => Err(anyhow!(
            "`{verb}` is a run mode handled before CLI parsing; this should be unreachable"
        )),
        other => Err(anyhow!("unknown infra command `{other}`")),
    }
}

fn parse_discover_command(rest: &[String]) -> Result<Command> {
    let [kind, flags @ ..] = rest else {
        return Err(anyhow!("discover requires `plex`"));
    };
    if kind != "plex" {
        return Err(anyhow!("unknown discovery kind `{kind}` (expected `plex`)"));
    }
    let mut owned_only = true;
    let mut token_env = "PLEX_ACCOUNT_TOKEN".to_owned();
    let mut output = std::path::PathBuf::from("fleet.yaml");
    let mut env_output = std::path::PathBuf::from("fleet.env");
    let mut diff = false;
    let mut iter = flags.iter();
    while let Some(flag) = iter.next() {
        match flag.as_str() {
            "--owned-only" => owned_only = true,
            "--include-shared" => owned_only = false,
            "--token-env" => token_env = flag_value(&mut iter, "--token-env")?,
            "--output" => output = flag_value(&mut iter, "--output")?.into(),
            "--env-output" => env_output = flag_value(&mut iter, "--env-output")?.into(),
            "--diff" => diff = true,
            other => return Err(anyhow!("unknown discover plex flag `{other}`")),
        }
    }
    Ok(Command::DiscoverPlex {
        owned_only,
        token_env,
        output,
        env_output,
        diff,
    })
}

fn parse_codemode_command(rest: &[String]) -> Result<Command> {
    let (mut code, mut file) = (None, None);
    let mut iter = rest.iter();
    while let Some(flag) = iter.next() {
        match flag.as_str() {
            "--code" => code = Some(flag_value(&mut iter, "codemode --code")?),
            "--file" => file = Some(flag_value(&mut iter, "codemode --file")?),
            other => {
                return Err(anyhow!(
                    "unknown codemode flag `{other}` (use --code or --file)"
                ));
            }
        }
    }
    let code = match (code, file) {
        (Some(_), Some(_)) => return Err(anyhow!("codemode: pass only one of --code or --file")),
        (Some(code), None) => code,
        (None, Some(path)) => std::fs::read_to_string(&path)
            .map_err(|e| anyhow!("codemode --file: could not read `{path}`: {e}"))?,
        (None, None) => return Err(anyhow!("codemode requires --code <JS> or --file <PATH>")),
    };
    Ok(Command::CodeMode { code })
}

fn flag_value(iter: &mut std::slice::Iter<String>, flag: &str) -> Result<String> {
    iter.next()
        .cloned()
        .ok_or_else(|| anyhow!("{flag} requires a value"))
}

fn parse_snippet_command(rest: &[String]) -> Result<Command> {
    let [sub, flags @ ..] = rest else {
        return Err(anyhow!(
            "snippet requires a subcommand (list, save, run, delete)"
        ));
    };
    match sub.as_str() {
        "list" => {
            reject_args(flags, "snippet list")?;
            Ok(Command::SnippetList)
        }
        "save" => parse_snippet_save(flags),
        "run" => parse_snippet_run(flags),
        "delete" => {
            let mut name = None;
            let mut iter = flags.iter();
            while let Some(flag) = iter.next() {
                match flag.as_str() {
                    "--name" => name = Some(flag_value(&mut iter, "--name")?),
                    other => return Err(anyhow!("unknown snippet delete flag `{other}`")),
                }
            }
            Ok(Command::SnippetDelete {
                name: name.ok_or_else(|| anyhow!("snippet delete requires --name"))?,
            })
        }
        other => Err(anyhow!(
            "unknown snippet subcommand `{other}` (list, save, run, delete)"
        )),
    }
}

fn parse_snippet_save(flags: &[String]) -> Result<Command> {
    let (mut name, mut code, mut file, mut description) = (None, None, None, None);
    let mut iter = flags.iter();
    while let Some(flag) = iter.next() {
        match flag.as_str() {
            "--name" => name = Some(flag_value(&mut iter, "--name")?),
            "--code" => code = Some(flag_value(&mut iter, "--code")?),
            "--file" => file = Some(flag_value(&mut iter, "--file")?),
            "--description" => description = Some(flag_value(&mut iter, "--description")?),
            other => return Err(anyhow!("unknown snippet save flag `{other}`")),
        }
    }
    let code = match (code, file) {
        (Some(_), Some(_)) => {
            return Err(anyhow!("snippet save: pass only one of --code or --file"));
        }
        (Some(code), None) => code,
        (None, Some(path)) => std::fs::read_to_string(&path)
            .map_err(|e| anyhow!("snippet save --file: could not read `{path}`: {e}"))?,
        (None, None) => {
            return Err(anyhow!(
                "snippet save requires --code <JS> or --file <PATH>"
            ));
        }
    };
    Ok(Command::SnippetSave {
        name: name.ok_or_else(|| anyhow!("snippet save requires --name"))?,
        code,
        description,
    })
}

fn parse_snippet_run(flags: &[String]) -> Result<Command> {
    let (mut name, mut input_str, mut input_file) = (None, None, None);
    let mut iter = flags.iter();
    while let Some(flag) = iter.next() {
        match flag.as_str() {
            "--name" => name = Some(flag_value(&mut iter, "--name")?),
            "--input" => input_str = Some(flag_value(&mut iter, "--input")?),
            "--input-file" => input_file = Some(flag_value(&mut iter, "--input-file")?),
            other => return Err(anyhow!("unknown snippet run flag `{other}`")),
        }
    }
    let input_text = match (input_str, input_file) {
        (Some(_), Some(_)) => {
            return Err(anyhow!(
                "snippet run: pass only one of --input or --input-file"
            ));
        }
        (Some(s), None) => Some(s),
        (None, Some(path)) => Some(
            std::fs::read_to_string(&path)
                .map_err(|e| anyhow!("snippet run --input-file: could not read `{path}`: {e}"))?,
        ),
        (None, None) => None,
    };
    let input = input_text.map_or(Ok(serde_json::Value::Null), |text| {
        serde_json::from_str(&text)
            .map_err(|e| anyhow!("snippet run --input must be valid JSON: {e}"))
    })?;
    Ok(Command::SnippetRun {
        name: name.ok_or_else(|| anyhow!("snippet run requires --name"))?,
        input,
    })
}

fn parse_setup_command(rest: &[String]) -> Result<Command> {
    match rest {
        [action, flags @ ..] if action == "check" => {
            reject_args(flags, "setup check")?;
            Ok(Command::Setup(SetupCommand::Check))
        }
        [action, flags @ ..] if action == "repair" => {
            reject_args(flags, "setup repair")?;
            Ok(Command::Setup(SetupCommand::Repair))
        }
        [action, flags @ ..] if action == "install" => {
            reject_args(flags, "setup install")?;
            Ok(Command::Setup(SetupCommand::Install))
        }
        [action, flags @ ..] if action == "plugin-hook" => {
            Ok(Command::Setup(SetupCommand::PluginHook {
                no_repair: parse_bool_flag(flags, "setup plugin-hook", "--no-repair")?,
            }))
        }
        [] => Err(anyhow!(
            "setup requires a subcommand (check, repair, install, plugin-hook)"
        )),
        [other, ..] => Err(anyhow!("unknown setup subcommand `{other}`")),
    }
}

#[cfg(test)]
#[path = "router_infra_tests.rs"]
mod tests;
