<?php

namespace App\Http\Controllers\Api;

use App\Models\Board;
use App\Models\Workspace;
use App\Services\PlanCapabilityService;
use Illuminate\Http\Request;

class BoardController extends ApiController
{
    public function index(Request $request, Workspace $workspace)
    {
        $this->authorize('view', $workspace);

        $boards = $workspace->boards()->orderBy('created_at', 'desc')->get();

        return response()->json(['boards' => $boards]);
    }

    public function store(Request $request, Workspace $workspace, PlanCapabilityService $plans)
    {
        $this->authorize('createBoard', $workspace);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', 'in:mindmap,whiteboard'],
            'settings_json' => ['sometimes', 'array'],
        ]);

        if (!$plans->canCreateBoard($workspace, $data['type'])) {
            return $this->error('Board limit reached.', 'board_limit_reached', 403);
        }

        $board = Board::create([
            'workspace_id' => $workspace->id,
            'name' => $data['name'],
            'type' => $data['type'],
            'settings_json' => $data['settings_json'] ?? null,
        ]);

        return response()->json(['board' => $board], 201);
    }

    public function show(Request $request, Board $board)
    {
        $this->authorize('view', $board);

        return response()->json(['board' => $board]);
    }

    public function update(Request $request, Board $board)
    {
        $this->authorize('update', $board);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'settings_json' => ['sometimes', 'array'],
        ]);

        $board->fill($data);
        $board->save();

        return response()->json(['board' => $board]);
    }

    public function destroy(Request $request, Board $board)
    {
        $this->authorize('delete', $board);

        $board->delete();

        return response()->json(['status' => 'ok']);
    }
}
