<?php

namespace App\Http\Controllers\Api;

use App\Models\Board;
use App\Models\BoardDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BoardDocumentController extends ApiController
{
    public function latest(Request $request, Board $board)
    {
        $this->authorize('view', $board);

        $document = $board->documents()->orderByDesc('version')->first();

        if (!$document) {
            return $this->error('Document not found.', 'document_not_found', 404);
        }

        return response()->json(['document' => $document]);
    }

    public function update(Request $request, Board $board)
    {
        $this->authorize('update', $board);

        $data = $request->validate([
            'base_version' => ['nullable', 'integer', 'min:0'],
            'content_json' => ['required', 'array'],
        ]);

        $baseVersion = $data['base_version'] ?? 0;

        $result = DB::transaction(function () use ($board, $baseVersion, $data) {
            $latest = BoardDocument::where('board_id', $board->id)
                ->orderByDesc('version')
                ->lockForUpdate()
                ->first();

            $latestVersion = $latest?->version ?? 0;

            if ($baseVersion !== $latestVersion) {
                return [
                    'conflict' => true,
                    'latest_version' => $latestVersion,
                ];
            }

            $document = BoardDocument::create([
                'board_id' => $board->id,
                'version' => $latestVersion + 1,
                'content_json' => $data['content_json'],
            ]);
 
            return [
                'document' => $document,
                'latest_version' => $latestVersion + 1,
            ];
        });

        if (!empty($result['conflict'])) {
            return $this->error('Document version conflict.', 'document_conflict', 409, [
                'latest_version' => $result['latest_version'] ?? null,
            ]);
        }

        return response()->json(['document' => $result['document']]);
    }
}
