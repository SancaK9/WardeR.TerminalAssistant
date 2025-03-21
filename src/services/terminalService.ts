import * as vscode from 'vscode';
import { CommandDefinition } from '../providers/commandsTreeProvider';

/**
 * Execute a terminal command with parameter handling
 * @param commandDef The command definition to execute
 */
export async function executeCommand(commandDef: CommandDefinition): Promise<void> {
    try {
        // Get the current active terminal or create a new one
        let terminal = vscode.window.activeTerminal;
        if (!terminal) {
            terminal = vscode.window.createTerminal('Terminal Assistant');
        }
        terminal.show();

        // Check if command has parameters
        let finalCommand = commandDef.command;
        
        if (commandDef.parameters && commandDef.parameters.length > 0) {
            // Get values for parameters
            const paramValues: Record<string, string> = {};
            
            for (const param of commandDef.parameters) {
                // If auto-execute is false, we'll prompt for all parameters
                if (!commandDef.autoExecute || !param.defaultValue) {
                    // Create placeholder text that includes default value if available
                    const placeholder = param.description || `Enter value for ${param.name}`;
                    const promptText = param.defaultValue 
                        ? `${placeholder} (default: ${param.defaultValue})` 
                        : placeholder;
                    
                    // Prompt for parameter value
                    const value = await vscode.window.showInputBox({
                        prompt: promptText,
                        placeHolder: param.name,
                        value: param.defaultValue
                    });
                    
                    // If user cancelled, stop the execution
                    if (value === undefined) {
                        vscode.window.showInformationMessage('Command execution cancelled');
                        return;
                    }
                    
                    paramValues[param.name] = value;
                } else {
                    // Use default value directly for auto-execute commands
                    paramValues[param.name] = param.defaultValue;
                }
            }
            
            // Replace all parameters in the command
            for (const [name, value] of Object.entries(paramValues)) {
                const regex = new RegExp(`\\{${name}\\}`, 'g');
                finalCommand = finalCommand.replace(regex, value);
            }
        }
        
        // Execute the command
        terminal.sendText(finalCommand);
        
    } catch (error) {
        vscode.window.showErrorMessage(`Error executing command: ${error}`);
    }
}
