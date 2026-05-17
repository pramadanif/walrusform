module move_worm_v2::worm {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::dynamic_field as df;
    use std::string::{String};

    /// A decentralized form pointer
    public struct Form has key, store {
        id: UID,
        title: String,
        form_blob_id: String,
        latest_submission_index_blob_id: String,
        creator: address,
    }

    /// A pool of rewards for a form
    public struct IncentivePool has key, store {
        id: UID,
        form_id: address,
        pool: Balance<SUI>,
        reward_per_response: u64,
        max_responses: u64,
        claimed_count: u64,
    }

    /// Team management for a form
    public struct Team has key, store {
        id: UID,
        form_id: address,
        members: vector<address>,
    }

    /// Metadata for a submission (Notes & Status)
    public struct SubmissionMeta has store, drop {
        status: String,
        note: String,
    }

    /// Event emitted when a form is registered
    public struct FormCreated has copy, drop {
        form_id: address,
        creator: address,
        form_blob_id: String,
    }

    /// Event emitted when a submission index is updated
    public struct SubmissionIndexUpdated has copy, drop {
        form_id: address,
        new_index_blob_id: String,
    }

    /// Event emitted when a team is created
    public struct TeamCreated has copy, drop {
        form_id: address,
        team_id: address,
    }

    // --- Seal SDK Compatibility ---

    public struct SealApproval has key, store {
        id: UID,
        form_id: address,
        approved_decryptors: vector<address>,
    }

    public entry fun create_form(
        title: String,
        form_blob_id: String,
        submission_index_blob_id: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let id = object::new(ctx);
        let form_id_addr = object::uid_to_address(&id);
        
        let form = Form {
            id,
            title,
            form_blob_id,
            latest_submission_index_blob_id: submission_index_blob_id,
            creator: sender,
        };

        transfer::share_object(form);

        event::emit(FormCreated {
            form_id: form_id_addr,
            creator: sender,
            form_blob_id,
        });
    }

    public entry fun create_incentivized_form(
        title: String,
        form_blob_id: String,
        submission_index_blob_id: String,
        reward_coin: Coin<SUI>,
        reward_per_response: u64,
        max_responses: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let id = object::new(ctx);
        let form_id_addr = object::uid_to_address(&id);
        
        let form = Form {
            id,
            title,
            form_blob_id,
            latest_submission_index_blob_id: submission_index_blob_id,
            creator: sender,
        };

        transfer::share_object(form);

        let pool_id = object::new(ctx);
        let pool = IncentivePool {
            id: pool_id,
            form_id: form_id_addr,
            pool: coin::into_balance(reward_coin),
            reward_per_response,
            max_responses,
            claimed_count: 0,
        };
        transfer::share_object(pool);

        event::emit(FormCreated {
            form_id: form_id_addr,
            creator: sender,
            form_blob_id,
        });
    }

    public entry fun create_team(
        form_id_addr: address,
        members: vector<address>,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let team_id_addr = object::uid_to_address(&id);
        let team = Team {
            id,
            form_id: form_id_addr,
            members,
        };
        transfer::share_object(team);

        event::emit(TeamCreated {
            form_id: form_id_addr,
            team_id: team_id_addr,
        });
    }

    public entry fun update_submission_index(
        form: &mut Form,
        new_index_blob_id: String,
        _ctx: &mut TxContext
    ) {
        form.latest_submission_index_blob_id = new_index_blob_id;

        event::emit(SubmissionIndexUpdated {
            form_id: object::uid_to_address(&form.id),
            new_index_blob_id,
        });
    }
    
    public entry fun update_submission_meta(
        form: &mut Form,
        team: &Team,
        submission_blob_id: String,
        status: String,
        note: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let is_creator = (form.creator == sender);
        let mut is_member = false;
        
        let len = vector::length(&team.members);
        let mut i = 0;
        while (i < len) {
            if (*vector::borrow(&team.members, i) == sender) {
                is_member = true;
                break
            };
            i = i + 1;
        };
        
        assert!(is_creator || is_member, 0);
        assert!(team.form_id == object::uid_to_address(&form.id), 1);

        if (df::exists(&form.id, submission_blob_id)) {
            let meta = df::borrow_mut<String, SubmissionMeta>(&mut form.id, submission_blob_id);
            meta.status = status;
            meta.note = note;
        } else {
            df::add(&mut form.id, submission_blob_id, SubmissionMeta { status, note });
        }
    }

    public entry fun seal_approve(
        form_id_addr: address,
        decryptors: vector<address>,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let approval = SealApproval {
            id,
            form_id: form_id_addr,
            approved_decryptors: decryptors,
        };
        transfer::share_object(approval);
    }

    public entry fun claim_reward(
        pool: &mut IncentivePool,
        ctx: &mut TxContext
    ) {
        assert!(pool.claimed_count < pool.max_responses, 0); // Pool exhausted
        let sender = tx_context::sender(ctx);
        let amount = pool.reward_per_response;
        assert!(balance::value(&pool.pool) >= amount, 1); // Insufficient funds
        
        let reward = coin::take(&mut pool.pool, amount, ctx);
        transfer::public_transfer(reward, sender);
        pool.claimed_count = pool.claimed_count + 1;
    }
}
