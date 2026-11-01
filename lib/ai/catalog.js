export const AI_MODELS = {
  nvidia: [
    { id: "minimaxai/minimax-m3.1-flash", name: "MiniMax M3.1 Flash" },
    { id: "nvidia/nemotron-3-nano-30b-a3b", name: "NVIDIA Nemotron 3 Nano" },
    { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct" },
  ],
  openai: [
    { id: "gpt-4.1-mini", name: "GPT-4.1 mini" },
    { id: "gpt-4.1", name: "GPT-4.1" },
  ],
};

export const AI_PROVIDERS = ["torqe_managed", "nvidia_byok", "openai_byok"];
